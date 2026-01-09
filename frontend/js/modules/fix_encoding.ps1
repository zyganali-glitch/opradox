# FAZ-QA-3: Folder-based Encoding Fix Script
# Fixes mojibake (UTF-8 byte interpretation errors) in multiple files
# Creates .bak backups before modifying

param(
    [string]$TargetDir = "C:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox\frontend"
)

# Target files to fix
$targetFiles = @(
    "js\modules\stats.js",
    "css\style.css",
    "js\selftest.js",
    "js\app.js",
    "js\modules\ui.js",
    "js\modules\data.js",
    "js\modules\core.js",
    "js\modules\texts.js",
    "js\modules\advanced.js"
)

# Mojibake mappings using hex byte sequences (ASCII-safe)
# Format: "hex_from" = "hex_to" where hex strings represent UTF-8 bytes
$hexMappings = @{
    # Turkish lowercase chars (mojibake -> correct UTF-8 hex)
    "C383C2BC"   = "C3BC"      # u with umlaut
    "C383C2A7"   = "C3A7"      # c with cedilla  
    "C384C2B1"   = "C4B1"      # dotless i
    "C384C29F"   = "C49F"      # g with breve
    "C385C29F"   = "C59F"      # s with cedilla
    "C383C2B6"   = "C3B6"      # o with umlaut
    # Turkish uppercase
    "C384C2B0"   = "C4B0"      # I with dot above
    "C383E280A1" = "C387"    # C with cedilla
    "C383E2809C" = "C39C"    # U with umlaut
    "C385C29E"   = "C59E"      # S with cedilla
    "C383E28093" = "C396"    # O with umlaut
    # Math symbols
    "C382C2B1"   = "C2B1"      # plus-minus
    "C382C2B2"   = "C2B2"      # superscript 2
    "C383E28094" = "C397"    # multiplication sign
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "FAZ-QA-3: Mojibake Encoding Fix Script" -ForegroundColor Cyan
Write-Host "Target Directory: $TargetDir" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan

$totalReplacements = 0
$filesProcessed = 0
$filesModified = 0

# Helper function to convert hex string to byte array
function ConvertFrom-HexString {
    param([string]$HexString)
    $bytes = @()
    for ($i = 0; $i -lt $HexString.Length; $i += 2) {
        $bytes += [Convert]::ToByte($HexString.Substring($i, 2), 16)
    }
    return [byte[]]$bytes
}

# Helper function to find and replace byte sequences
function Replace-ByteSequence {
    param(
        [byte[]]$Source,
        [byte[]]$Find,
        [byte[]]$Replace
    )
    
    $result = [System.Collections.ArrayList]@()
    [void]$result.AddRange($Source)
    $count = 0
    $i = 0
    
    while ($i -le ($result.Count - $Find.Length)) {
        $match = $true
        for ($j = 0; $j -lt $Find.Length; $j++) {
            if ($result[$i + $j] -ne $Find[$j]) {
                $match = $false
                break
            }
        }
        
        if ($match) {
            # Remove the found sequence
            for ($k = 0; $k -lt $Find.Length; $k++) {
                $result.RemoveAt($i)
            }
            # Insert the replacement
            for ($k = 0; $k -lt $Replace.Length; $k++) {
                $result.Insert($i + $k, $Replace[$k])
            }
            $i += $Replace.Length
            $count++
        }
        else {
            $i++
        }
    }
    
    return @{
        Bytes = [byte[]]$result.ToArray()
        Count = $count
    }
}

foreach ($relPath in $targetFiles) {
    $fullPath = Join-Path $TargetDir $relPath
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "[SKIP] File not found: $relPath" -ForegroundColor Yellow
        continue
    }
    
    $filesProcessed++
    Write-Host "`n[PROCESS] $relPath" -ForegroundColor White
    
    # Create backup
    $backupPath = "$fullPath.bak"
    Copy-Item $fullPath $backupPath -Force
    Write-Host "  [BACKUP] Created: $($relPath).bak" -ForegroundColor Gray
    
    # Read content as bytes
    $bytes = [System.IO.File]::ReadAllBytes($fullPath)
    $originalBytes = $bytes.Clone()
    $fileReplacements = 0
    
    # Apply hex mappings
    foreach ($fromHex in $hexMappings.Keys) {
        $toHex = $hexMappings[$fromHex]
        $findBytes = ConvertFrom-HexString $fromHex
        $replaceBytes = ConvertFrom-HexString $toHex
        
        $replaceResult = Replace-ByteSequence -Source $bytes -Find $findBytes -Replace $replaceBytes
        if ($replaceResult.Count -gt 0) {
            $bytes = $replaceResult.Bytes
            $fileReplacements += $replaceResult.Count
            $fromStr = [System.Text.Encoding]::UTF8.GetString($findBytes)
            $toStr = [System.Text.Encoding]::UTF8.GetString($replaceBytes)
            Write-Host "    Hex pattern $fromHex -> $toHex : $($replaceResult.Count)" -ForegroundColor DarkGray
        }
    }
    
    # Check if content changed
    $changed = $false
    if ($bytes.Length -ne $originalBytes.Length) {
        $changed = $true
    }
    else {
        for ($i = 0; $i -lt $bytes.Length; $i++) {
            if ($bytes[$i] -ne $originalBytes[$i]) {
                $changed = $true
                break
            }
        }
    }
    
    if ($changed) {
        [System.IO.File]::WriteAllBytes($fullPath, $bytes)
        $filesModified++
        Write-Host "  [MODIFIED] $fileReplacements replacements" -ForegroundColor Green
    }
    else {
        Write-Host "  [CLEAN] No changes needed" -ForegroundColor DarkGreen
        # Remove backup if no changes
        Remove-Item $backupPath -Force
    }
    
    $totalReplacements += $fileReplacements
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "REPORT" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Files processed: $filesProcessed" -ForegroundColor White
Write-Host "Files modified:  $filesModified" -ForegroundColor $(if ($filesModified -gt 0) { "Yellow" } else { "Green" })
Write-Host "Total replacements: $totalReplacements" -ForegroundColor $(if ($totalReplacements -gt 0) { "Yellow" } else { "Green" })
Write-Host "============================================" -ForegroundColor Cyan

if ($totalReplacements -eq 0) {
    Write-Host "`nAll files are clean - no mojibake detected!" -ForegroundColor Green
}
else {
    Write-Host "`nBackup files created with .bak extension" -ForegroundColor Yellow
    Write-Host "Review changes and delete .bak files when satisfied" -ForegroundColor Yellow
}

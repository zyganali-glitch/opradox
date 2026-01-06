$excludes = @("node_modules", ".git", "__pycache__", "_archive_before_cleanup", "tools", "package-lock.json")
$exts = @(".py", ".js", ".html", ".css")
# Using a simpler matching for the path to avoid encoding issues with "çöp kutusu"
$trashPattern = "kutusu"

$root = "c:\Users\ASUS 6410\.gemini\antigravity\scratch\opradox"

$files = Get-ChildItem -Path $root -Recurse -File | Where-Object {
    $path = $_.FullName
    $skip = $false
    
    # Check standard excludes
    foreach ($ex in $excludes) {
        if ($path -match [regex]::Escape($ex)) { $skip = $true; break }
    }
    
    # Check trash pattern separately
    if (-not $skip -and $path -match $trashPattern) {
        $skip = $true
    }

    if (-not $skip) {
        if ($exts -contains $_.Extension) { $true } else { $false }
    }
    else { $false }
}

$totalLines = 0
$byLang = @{}
$fileCounts = @{}

foreach ($f in $files) {
    $lines = Get-Content $f.FullName
    # Count non-empty lines
    $nonEmpty = $lines | Where-Object { $_.Trim().Length -gt 0 }
    $count = ($nonEmpty | Measure-Object).Count
    $totalLines += $count
    
    $ext = $f.Extension
    if (-not $byLang.ContainsKey($ext)) { $byLang[$ext] = 0 }
    $byLang[$ext] += $count
    
    $fileCounts[$f.FullName] = $count
}

Write-Output "Total Non-Empty Lines: $totalLines"
Write-Output "`nBreakdown by Language:"
$byLang.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    Write-Output "$($_.Key): $($_.Value)"
}

Write-Output "`nTop 10 Largest Files:"
$fileCounts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10 | ForEach-Object {
    Write-Output "$($_.Value) - $($_.Key.Replace($root, ''))"
}

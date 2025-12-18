
$catalogPath = "backend\config\scenarios_catalog.json"
Write-Host "Reading $catalogPath"

if (-not (Test-Path $catalogPath)) {
    Write-Host "Catalog not found"
    exit
}

try {
    $jsonContent = Get-Content -Raw -Path $catalogPath
    $data = $jsonContent | ConvertFrom-Json
    Write-Host "Data Count: $($data.Count)"
    
    if ($data.Count -gt 0) {
        $first = $data[0]
        Write-Host "First item ID: $($first.id)"
        Write-Host "First item impl: $($first.implementation.module)"
    }
    
    foreach ($entry in $data) {
        if ($entry.id -eq "basic-summary-stats-column") {
             Write-Host "FOUND basic-summary-stats-column"
             Write-Host "Module: $($entry.implementation.module)"
        }
        
        if ($entry.implementation) {
            $mod = $entry.implementation.module
            if ($mod) { # -match "^app\."
                # Write-Host "Checking $mod"
                if ($mod -match "^app\.") {
                    $rel = $mod -replace "^app\.", "" -replace "\.", "\"
                    $rel = "$rel.py"
                    $fullPath = "backend\app\$rel"
                    
                    if (-not (Test-Path $fullPath)) {
                        Write-Output "MISSING|$($entry.id)|$fullPath"
                    }
                }
            }
        }
    }
} catch {
    Write-Host "Error: $_"
}

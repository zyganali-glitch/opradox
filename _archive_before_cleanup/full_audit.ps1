
$catalogPath = "backend\config\scenarios_catalog.json"

if (-not (Test-Path $catalogPath)) {
    Write-Host "Catalog not found"
    exit
}

$content = Get-Content -Raw -Path $catalogPath
$data = $content | ConvertFrom-Json

Write-Host "Total Items (JSON): $($data.Count)"

foreach ($entry in $data) {
    $impl = $entry.implementation
    $status = "OK"
    $mod = $null
    
    if (-not $impl) {
        $status = "NO_IMPL_BLOCK"
    } else {
        $mod = $impl.module
        if (-not $mod) {
            $status = "EMPTY_MODULE"
        } else {
            if ($mod -match "^app\.") {
                $rel = $mod -replace "^app\.", "" -replace "\.", "\"
                $rel = "$rel.py"
                $fullPath = "backend\app\$rel"
                if (-not (Test-Path $fullPath)) {
                    $status = "FILE_MISSING"
                }
            } else {
               $status = "BAD_MODULE_PATH"
            }
        }
    }
    
    Write-Host "$($entry.id)|$status|$mod"
}

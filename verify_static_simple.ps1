
$catalogPath = "backend\config\scenarios_catalog.json"
$data = Get-Content -Raw -Path $catalogPath | ConvertFrom-Json

$results = @()

foreach ($entry in $data) {
    $status = "OK"
    $mod = $entry.implementation.module
    
    if (-not $mod) {
        $status = "NO_MODULE_DEFINED"
    } else {
        if ($mod -match "^app\.") {
            $rel = $mod -replace "^app\.", "" -replace "\.", "\"
            $rel = "$rel.py"
            $fullPath = "backend\app\$rel"
            
            if (-not (Test-Path $fullPath)) {
                $status = "FILE_MISSING"
            } else {
                $content = Get-Content -Raw $fullPath
                if ($content -match "from \.\.") {
                    $status = "RELATIVE_IMPORT_RISK"
                }
                if ($content -notmatch "def run\(") {
                    $status = "MISSING_RUN_FUNC"
                }
                if ($content -match "def run\(file") {
                    $status = "LEGACY_SIGNATURE"
                }
            }
        }
    }
    if ($status -ne "OK") {
        Write-Output "$($entry.id)|$status"
    }
}

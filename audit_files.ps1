
$catalogPath = "backend\config\scenarios_catalog.json"
$appDir = "backend\app"

if (-not (Test-Path $catalogPath)) {
    Write-Host "Catalog not found"
    exit
}

$jsonContent = Get-Content -Raw -Path $catalogPath
$data = $jsonContent | ConvertFrom-Json

$missing = @()

foreach ($entry in $data) {
    if ($entry.implementation) {
        $mod = $entry.implementation.module
        if ($mod -match "^app\.") {
            # app.scenarios.foo -> scenarios\foo.py
            $rel = $mod -replace "^app\.", "" -replace "\.", "\"
            $rel = "$rel.py"
            
            # Full path relative to CWD (root)
            # We assume script run from root, so backend/app/...
            $fullPath = "backend\app\$rel"
            
            if (-not (Test-Path $fullPath)) {
                $obj = New-Object PSObject -Property @{
                    id = $entry.id
                    title = $entry.title_tr
                    module = $mod
                    path = $fullPath
                    category = $entry.category
                }
                $missing += $obj
            }
        }
    }
}

$missing | ConvertTo-Json

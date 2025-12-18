
$catalogPath = "backend\config\scenarios_catalog.json"
$appDir = "backend\app"

if (-not (Test-Path $catalogPath)) {
    Write-Host "Catalog not found"
    exit
}

$jsonContent = Get-Content -Raw -Path $catalogPath
$data = $jsonContent | ConvertFrom-Json

$incomplete = @()

foreach ($entry in $data) {
    $issues = @()
    
    # Check params
    if (-not $entry.params -or $entry.params.Count -eq 0) {
        $issues += "Missing params"
    }

    # Check help
    if (-not $entry.help_tr) {
        $issues += "Missing help_tr"
    }

    # Check implementation
    if ($entry.implementation) {
        $mod = $entry.implementation.module
        if ($mod -match "^app\.") {
            $rel = $mod -replace "^app\.", "" -replace "\.", "\"
            $rel = "$rel.py"
            $full = Join-Path $appDir $rel
            if (-not (Test-Path $full)) {
                $issues += "Missing file: $rel"
            }
        }
    } else {
        $issues += "Missing implementation config"
    }
    
    if ($issues.Count -gt 0) {
        $obj = New-Object PSObject -Property @{
            id = $entry.id
            title = $entry.title_tr
            issues = $issues -join ", "
        }
        $incomplete += $obj
    }
}

$incomplete | ConvertTo-Json

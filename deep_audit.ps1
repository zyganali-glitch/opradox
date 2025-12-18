
$catalogPath = "backend\config\scenarios_catalog.json"

if (-not (Test-Path $catalogPath)) {
    Write-Host "Catalog not found"
    exit
}

$jsonContent = Get-Content -Raw -Path $catalogPath
$data = $jsonContent | ConvertFrom-Json

# Check for duplicates
$grouped = $data | Group-Object id
$duplicates = $grouped | Where-Object { $_.Count -gt 1 }

if ($duplicates) {
    Write-Host "DUPLICATE IDS FOUND:"
    foreach ($d in $duplicates) {
        Write-Host "ID: $($d.Name) - Count: $($d.Count)"
    }
} else {
    Write-Host "No duplicates found."
}

$incomplete = @()

foreach ($entry in $data) {
    $issues = @()
    
    if (-not $entry.params -or $entry.params.Count -eq 0) {
        $issues += "Missing params"
    }

    if (-not $entry.help_tr) {
        $issues += "Missing help_tr"
    } else {
        if (-not $entry.help_tr.what_is_tr) { $issues += "Missing help_tr.what_is_tr" }
        if (-not $entry.help_tr.how_to_tr) { $issues += "Missing help_tr.how_to_tr" }
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

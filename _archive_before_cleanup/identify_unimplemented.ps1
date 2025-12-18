
$catalogPath = "backend\config\scenarios_catalog.json"
$data = Get-Content -Raw -Path $catalogPath | ConvertFrom-Json

$unimplemented = @()

foreach ($entry in $data) {
    $hasImpl = $false
    if ($entry.implementation) {
        if ($entry.implementation.module) {
            $hasImpl = $true
        }
    }
    
    if (-not $hasImpl) {
        $unimplemented += [PSCustomObject]@{
            id = $entry.id
            category = $entry.category
            title = $entry.title_tr
        }
    }
}

$unimplemented | ConvertTo-Json

$path = "C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\frontend\admin.html"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# Remove the specific bad patterns
$content = $content -replace "100:", ""
$content = $content -replace "101: ", ""
$content = $content -replace "102: ", ""
$content = $content -replace "103: ", ""
$content = $content -replace "104: ", ""
$content = $content -replace "105: ", ""
$content = $content -replace "106: ", ""
$content = $content -replace "107: ", ""
$content = $content -replace "108: ", ""
$content = $content -replace "109: ", ""
$content = $content -replace "110: ", ""
$content = $content -replace "111: ", ""
$content = $content -replace "112: ", ""
$content = $content -replace "113: ", ""

[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "Fixed!"

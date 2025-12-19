$adminJsPath = "C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\frontend\js\admin.js"
$content = [System.IO.File]::ReadAllLines($adminJsPath, [System.Text.Encoding]::UTF8)

$fixedLines = @()
for ($i = 0; $i -lt $content.Length; $i++) {
    if ($i -eq 46) {
        # Line 47 (0-indexed 46) - fix it completely
        $fixedLines += "async function verifyTokenAndInit() {"
        $fixedLines += "    const token = getAuthToken();"
        $fixedLines += "    console.log('Token kontrolü:', token ? 'Token mevcut' : 'Token yok');"
        $fixedLines += "    console.log('API_ROOT:', API_ROOT);"
    } else {
        $fixedLines += $content[$i]
    }
}

[System.IO.File]::WriteAllLines($adminJsPath, $fixedLines, [System.Text.Encoding]::UTF8)

Write-Host "admin.js line 47 fixed successfully!"

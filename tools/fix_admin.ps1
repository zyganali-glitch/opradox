$adminJsPath = "C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\frontend\js\admin.js"
$content = [System.IO.File]::ReadAllLines($adminJsPath, [System.Text.Encoding]::UTF8)

$fixedLines = @()
for ($i = 0; $i -lt $content.Length; $i++) {
    if ($i -eq 5) {
        # Line 6 (0-indexed 5) - fix it
        $fixedLines += "// API root - development: localhost:8100, production: window.location.origin"
        $fixedLines += "const API_ROOT = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')"
        $fixedLines += "    ? 'http://127.0.0.1:8100'"
        $fixedLines += "    : window.location.origin;"
    } else {
        $fixedLines += $content[$i]
    }
}

[System.IO.File]::WriteAllLines($adminJsPath, $fixedLines, [System.Text.Encoding]::UTF8)

Write-Host "admin.js fixed successfully!"

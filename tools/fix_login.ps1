$loginHtmlPath = "C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\frontend\login.html"
$content = [System.IO.File]::ReadAllLines($loginHtmlPath, [System.Text.Encoding]::UTF8)

$fixedLines = @()
for ($i = 0; $i -lt $content.Length; $i++) {
    if ($i -eq 225) {
        # Line 226 (0-indexed 225) - fix it
        $fixedLines += "        // API root - development: localhost:8100, production: window.location.origin"
        $fixedLines += "        const API_ROOT = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')"
        $fixedLines += "            ? 'http://127.0.0.1:8100'"
        $fixedLines += "            : window.location.origin;"
    } else {
        $fixedLines += $content[$i]
    }
}

[System.IO.File]::WriteAllLines($loginHtmlPath, $fixedLines, [System.Text.Encoding]::UTF8)

Write-Host "login.html fixed successfully!"

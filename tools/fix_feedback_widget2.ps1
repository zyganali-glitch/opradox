$appJsPath = "C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\frontend\js\app.js"
$content = [System.IO.File]::ReadAllLines($appJsPath, [System.Text.Encoding]::UTF8)

$fixedLines = @()
for ($i = 0; $i -lt $content.Length; $i++) {
    if ($i -eq 755) {
        # Line 756 (0-indexed 755) - fix it
        $fixedLines += "    });"
        $fixedLines += ""
        $fixedLines += "    // Feedback widget placeholder ve title'ları (YENİ)"
        $fixedLines += "    document.querySelectorAll(`"[data-i18n-placeholder]`").forEach(el => {"
        $fixedLines += "        const key = el.getAttribute(`"data-i18n-placeholder`");"
        $fixedLines += "        if (T[key]) el.placeholder = T[key];"
        $fixedLines += "    });"
        $fixedLines += ""
        $fixedLines += "    document.querySelectorAll(`"[data-i18n-title]`").forEach(el => {"
        $fixedLines += "        const key = el.getAttribute(`"data-i18n-title`");"
        $fixedLines += "        if (T[key]) el.title = T[key];"
        $fixedLines += "    });"
    } else {
        $fixedLines += $content[$i]
    }
}

[System.IO.File]::WriteAllLines($appJsPath, $fixedLines, [System.Text.Encoding]::UTF8)

Write-Host "File fixed successfully!"

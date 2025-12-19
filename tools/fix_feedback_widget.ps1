$appJsPath = "C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\frontend\js\app.js"
$content = [System.IO.File]::ReadAllText($appJsPath, [System.Text.Encoding]::UTF8)

# Remove the malformed feedback widget code (with escaped characters)
$pattern = '    \}\); \\r\\n\\r\\n    // Feedback widget placeholder ve title''ları \(YENİ\)\\r\\n    document\.querySelectorAll\(\\"' + '\[data-i18n-placeholder\]\\"' + '\)\.forEach\(el =\\u003e \{\\r\\n        const key = el\.getAttribute\(\\"data-i18n-placeholder\\"\);\\r\\n        if \(T\[key\]\) el\.placeholder = T\[key\];\\r\\n    \}\);\\r\\n\\r\\n    document\.querySelectorAll\(\\"' + '\[data-i18n-title\]\\"' + '\)\.forEach\(el =\\u003e \{\\r\\n        const key = el\.getAttribute\(\\"data-i18n-title\\"\);\\r\\n        if \(T\[key\]\) el\.title = T\[key\];\\r\\n    \}\);\\r\\n'

$replacement = @'
    });

    // Feedback widget placeholder ve title'ları (YENİ)
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (T[key]) el.placeholder = T[key];
    });

    document.querySelectorAll("[data-i18n-title]").forEach(el => {
        const key = el.getAttribute("data-i18n-title");
        if (T[key]) el.title = T[key];
    });

'@

$newContent = $content -replace [regex]::Escape($pattern), $replacement

[System.IO.File]::WriteAllText($appJsPath, $newContent, [System.Text.Encoding]::UTF8)

Write-Host "File fixed successfully!"

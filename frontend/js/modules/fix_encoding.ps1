$path = "C:\Users\MEHMET\.gemini\antigravity\scratch\opradox\frontend\js\modules\stats.js"
$content = [System.IO.File]::ReadAllText($path)

# Character mappings (Manual UTF-8 byte interpretation fix)
$replacements = @{
    'Ã¼' = 'ü'
    'Ã§' = 'ç'
    'Ä±' = 'ı'
    'ÄŸ' = 'ğ'
    'ÅŸ' = 'ş'
    'Ã¶' = 'ö'
    'Ä°' = 'İ'
    'Ã‡' = 'Ç'
    'Ãœ' = 'Ü'
    'Åž' = 'Ş'
    'Ã–' = 'Ö'
    'â†’' = '→'
    'â‰¥' = '≥'
    'â‰¤' = '≤'
    'Ã—' = '×'
    'Â±' = '±'
    'âˆš' = '√'
    'Â²' = '²'
    'Å' = 'Ş' 
}

# Note: Added 'Å' = 'Ş' cautiously, might be 'Ş' or 'ş' depending on context, assuming mostly Title Case if alone.
# But 'ÅŸ' is handled before, so 'Å' remaining is likely 'Ş'.

foreach ($key in $replacements.Keys) {
    $content = $content.Replace($key, $replacements[$key])
}

# Fix common words to be safe
$content = $content.Replace('daÄŸÄ±lÄ±m', 'dağılım')
$content = $content.Replace('kÃ¼mÃ¼latif', 'kümülatif')
$content = $content.Replace('bÃ¼yÃ¼klÃ¼ÄŸÃ¼', 'büyüklüğü')
$content = $content.Replace('aralÄ±ÄŸÄ±', 'aralığı')
$content = $content.Replace('AnlamlÄ±lÄ±k', 'Anlamlılık')
$content = $content.Replace('VarsayÄ±mlar', 'Varsayımlar')
$content = $content.Replace('deÄŸer', 'değer')
$content = $content.Replace('deÄŸiÅŸken', 'değişken')
$content = $content.Replace('sonuÃ§larÄ±', 'sonuçları')
$content = $content.Replace('standardÄ±na', 'standardına')
$content = $content.Replace('Ã§Ä±ktÄ±', 'çıktı')
$content = $content.Replace('Ã¼retir', 'üretir')
$content = $content.Replace('Ã–rneklem', 'Örneklem') 

[System.IO.File]::WriteAllText($path, $content)
Write-Host "Encoding fix completed."

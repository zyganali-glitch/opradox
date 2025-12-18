@echo off
chcp 65001 > nul
echo ========================================================
echo   opradox: Calismayi Kaydet ve Buluta Yukle
echo ========================================================

:: 1. DEGISKENLER
:: Bu anlik konusmanin hafiza klasoru (Burasini ben otomatik guncelledim)
set "BRAIN_DIR=C:\Users\ASUS 6410\.gemini\antigravity\brain\b0fb37f8-7757-4d8b-a6fc-130d6e5f2870"
set "PROJECT_MEMORY_DIR=documentation\memory"

echo 1. Hafiza dosyalari projeye yedekleniyor...
if not exist "%PROJECT_MEMORY_DIR%" mkdir "%PROJECT_MEMORY_DIR%"

:: 2. DOSYA KOPYALAMA (Sadece md dosyalari)
copy /Y "%BRAIN_DIR%\*.md" "%PROJECT_MEMORY_DIR%\" > nul
echo    - Planlar ve notlar kopyalandi.

:: 3. GIT ISLEMLERI
echo.
echo 2. Degisiklikler kontrol ediliyor...
git pull
if %errorlevel% neq 0 (
    echo [UYARI] Git Pull sirasinda hata oldu. Cakisma olabilir.
    echo Yine de devam ediliyor...
)

echo.
echo 3. Degisiklikler paketleniyor...
git add .
git commit -m "Otomatik yedek: %date% %time%"

echo.
echo 4. Buluta gonderiliyor...
git push

echo.
echo ========================================================
echo   ISLEM TAMAMLANDI! 
echo   Bilgisayari kapatabilirsin krali.
echo ========================================================
pause

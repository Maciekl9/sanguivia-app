@echo off
cd /d "%~dp0"
echo Uruchamianie Sanguivia - Centrum Dowodzenia...
echo.
echo Sprawdzanie aplikacji...
if not exist "build\electron.js" (
    echo BŁĄD: Nie znaleziono pliku electron.js
    pause
    exit /b 1
)
if not exist "build\index.html" (
    echo BŁĄD: Nie znaleziono pliku index.html
    pause
    exit /b 1
)
if not exist "node_modules\electron\dist\electron.exe" (
    echo BŁĄD: Nie znaleziono Electron
    pause
    exit /b 1
)

echo Uruchamianie aplikacji...
start "" "node_modules\electron\dist\electron.exe" "electron-simple.js"
echo.
echo Aplikacja została uruchomiona!
echo.
echo Dane logowania:
echo Email: test@sanguivia.pl
echo Hasło: Test123!
echo.
pause

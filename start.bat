@echo off
echo 🚀 Uruchamianie Sanguivia Desktop...
echo.

REM Sprawdź czy Node.js jest zainstalowany
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js nie jest zainstalowany!
    echo 💡 Pobierz Node.js z https://nodejs.org/
    pause
    exit /b 1
)

REM Sprawdź czy npm jest dostępny
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm nie jest dostępny!
    pause
    exit /b 1
)

REM Zainstaluj zależności jeśli nie istnieją
if not exist "node_modules" (
    echo 📦 Instaluję zależności...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Błąd instalacji zależności!
        pause
        exit /b 1
    )
)

REM Uruchom aplikację
echo ✅ Uruchamiam Sanguivia...
node launcher.js

pause
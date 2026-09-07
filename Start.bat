@echo off
title AR-Program - Backend Server
cd /d "%~dp0"

rem التأكد من وجود Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install it from https://nodejs.org/
    pause
    exit /b 1
)

rem تثبيت الاعتماديات عند أول تشغيل فقط
if not exist "backend\node_modules\express" (
    echo Installing backend dependencies...
    cd backend
    call npm install --no-fund --no-audit
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    cd ..
)

rem إيقاف أي خادم قديم على المنفذ 8080 (مثلاً python http.server)
powershell -NoProfile -Command "$id = (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue).OwningProcess; if ($id) { Stop-Process -Id $id -Force }"

rem تشغيل خادم Node في نافذة مصغّرة
start "AR-Program Backend" /min cmd /c "cd /d ""%~dp0"" && node backend\server.js > backend\server.log 2>&1"

rem انتظار ثوانٍ ثم فتح المتصفح
timeout /t 3 /nobreak >nul
start "" "http://localhost:8080"

echo.
echo AR-Program is running at: http://localhost:8080
echo Login: admin / admin123
pause
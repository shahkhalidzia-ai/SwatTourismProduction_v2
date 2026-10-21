@echo off
title Swat Tourism Platform Launcher
color 0B

echo =====================================================================
echo                SWAT TOURISM PLATFORM - LAUNCHER
echo =====================================================================
echo.

set ROOT_DIR=%~dp0

:: 1. Verify Python availability
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in your system PATH.
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b 1
)

:: 2. Verify Node / npm availability
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in your system PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: 3. Clear any existing processes occupying ports 8090 or 5180
echo [*] Checking and freeing ports 8090 and 5180...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8090" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5180" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: 4. Verify node_modules in frontend
if not exist "%ROOT_DIR%frontend\node_modules\" (
    echo [*] Frontend dependencies not found. Installing packages via npm install...
    cd /d "%ROOT_DIR%frontend"
    call npm install
    cd /d "%ROOT_DIR%"
)

:: 5. Launch FastAPI Backend
echo [*] [1/2] Launching Backend API (FastAPI on Port 8090)...
start "Swat Tourism - Backend API (Port 8090)" cmd /k "cd /d "%ROOT_DIR%backend" && title Swat Tourism - Backend API && python -m uvicorn app.main:app --port 8090 --host 0.0.0.0 --reload"

:: 6. Launch Vite Frontend
echo [*] [2/2] Launching Frontend Web App (Vite on Port 5180)...
start "Swat Tourism - Frontend App (Port 5180)" cmd /k "cd /d "%ROOT_DIR%frontend" && title Swat Tourism - Frontend App && npm run dev -- --port 5180 --host"

:: 7. Wait briefly for services to spin up
echo [*] Waiting for services to initialize...
ping 127.0.0.1 -n 4 >nul

echo.
echo =====================================================================
echo   Swat Tourism Platform is now running successfully!
echo.
echo   - Web Application:   http://localhost:5180
echo   - Backend Swagger:   http://localhost:8090/docs
echo.
echo   To STOP the application:
echo   - Run 'stop.bat' or close the opened terminal windows.
echo =====================================================================
echo.

:: Automatically open default browser
start http://localhost:5180

echo Opened http://localhost:5180 in your browser.
ping 127.0.0.1 -n 3 >nul
exit /b 0

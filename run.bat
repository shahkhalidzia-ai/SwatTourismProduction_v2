@echo off
title Swat Tourism Platform Launcher
color 0A

echo ===============================================================
echo        Starting Swat Tourism Platform Application...
echo ===============================================================
echo.

set ROOT_DIR=%~dp0

:: Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in your PATH. Please install Python.
    pause
    exit /b 1
)

:: Check Node/NPM
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not found in your PATH. Please install Node.js.
    pause
    exit /b 1
)

:: Free ports if already occupied
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8090" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5180" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [1/3] Launching FastAPI Backend (Port 8090)...
start "Swat Tourism - Backend API (8090)" cmd /k "cd /d "%ROOT_DIR%backend" && title Swat Tourism - Backend API && python -m uvicorn app.main:app --port 8090 --host 0.0.0.0 --reload"

echo [2/3] Launching Vite Frontend (Port 5180)...
start "Swat Tourism - Frontend App (5180)" cmd /k "cd /d "%ROOT_DIR%frontend" && title Swat Tourism - Frontend App && npm run dev -- --port 5180 --host"

echo [3/3] Waiting for services to initialize...
ping 127.0.0.1 -n 4 >nul

echo.
echo ===============================================================
echo   Swat Tourism Platform is now RUNNING!
echo.
echo   - Frontend Web App:  http://localhost:5180
echo   - Backend API Docs:  http://localhost:8090/docs
echo.
echo   To stop the application:
echo   - Close the two terminal windows, or run stop.bat
echo ===============================================================
echo.

:: Automatically open default browser
start http://localhost:5180

echo Opening http://localhost:5180 in your browser...
ping 127.0.0.1 -n 3 >nul

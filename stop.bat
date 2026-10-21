@echo off
title Stop Swat Tourism Platform
color 0C

echo ===============================================================
echo        Stopping Swat Tourism Platform (Ports 8090 & 5180)...
echo ===============================================================
echo.

:: Kill process listening on port 8090 (Backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8090" ^| findstr "LISTENING"') do (
    echo Stopping Backend process on port 8090 (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

:: Kill process listening on port 5180 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5180" ^| findstr "LISTENING"') do (
    echo Stopping Frontend process on port 5180 (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Swat Tourism Platform services stopped.
ping 127.0.0.1 -n 3 >nul

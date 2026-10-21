@echo off
title Clear All Trips Data - Swat Tourism Platform
color 0E

echo ===============================================================
echo            SWAT TOURISM PLATFORM - TRIPS CLEANER
echo ===============================================================
echo.
echo  This utility will completely clear:
echo    - All Trips (all user itineraries)
echo    - All Trip Stops (destinations, listings, custom stops)
echo    - All Bookings ^& Booking History linked to trips
echo    - All Saved Wishlist Items
echo    - All Trip ^& Booking Notifications
echo.
echo  Note: User accounts, hotels, listings, and places will NOT be touched.
echo ===============================================================
echo.

set ROOT_DIR=%~dp0

:: Check for automatic confirmation flags
if /i "%1"=="/y" goto run_clean
if /i "%1"=="-y" goto run_clean
if /i "%1"=="--yes" goto run_clean
if /i "%1"=="/force" goto run_clean
if /i "%1"=="-f" goto run_clean

set /p CONFIRM="Are you sure you want to clear ALL trips data? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo.
    echo Operation cancelled by user. No data was changed.
    echo.
    pause
    exit /b 0
)

:run_clean
echo.
echo [1/2] Locating Python environment...

set PYTHON_CMD=
where python >nul 2>nul
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
) else (
    if exist "%ROOT_DIR%backend\.venv\Scripts\python.exe" (
        set "PYTHON_CMD=%ROOT_DIR%backend\.venv\Scripts\python.exe"
    ) else if exist "%ROOT_DIR%.venv\Scripts\python.exe" (
        set "PYTHON_CMD=%ROOT_DIR%.venv\Scripts\python.exe"
    ) else if exist "%ROOT_DIR%venv\Scripts\python.exe" (
        set "PYTHON_CMD=%ROOT_DIR%venv\Scripts\python.exe"
    )
)

if "%PYTHON_CMD%"=="" (
    echo [ERROR] Python is not found in your PATH or virtual environment.
    echo Please ensure Python is installed and accessible.
    pause
    exit /b 1
)

echo [2/2] Running cleanup script...
echo.
"%PYTHON_CMD%" "%ROOT_DIR%backend\scripts\clear_all_trips.py"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Cleanup encountered an error.
    pause
    exit /b %errorlevel%
)

echo.
echo ===============================================================
echo  Cleanup Complete! You can now start adding fresh trips.
echo ===============================================================
echo.
if /i "%1"=="/y" goto end
if /i "%1"=="-y" goto end
if /i "%1"=="--yes" goto end
if /i "%1"=="/force" goto end
if /i "%1"=="-f" goto end
pause

:end


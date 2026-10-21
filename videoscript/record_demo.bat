@echo off
setlocal
title Swat Tourism - Record Demo Video
cd /d "%~dp0"

rem ============================================================
rem  EDIT THESE SETTINGS, THEN SAVE AND DOUBLE-CLICK THIS FILE
rem  Tip: do not use the % character in a password.
rem ============================================================
set "DEMO_BASE_URL=http://localhost:5180/"

set "DEMO_TOURIST_EMAIL=tourist@test.local"
set "DEMO_TOURIST_PASSWORD=CHANGE_ME"
set "DEMO_BUSINESS_EMAIL=hotel.mingora@test.local"
set "DEMO_BUSINESS_PASSWORD=CHANGE_ME"
set "DEMO_COMMUNITY_EMAIL=community@test.local"
set "DEMO_COMMUNITY_PASSWORD=CHANGE_ME"
set "DEMO_AUTHORITY_EMAIL=admin@test.local"
set "DEMO_AUTHORITY_PASSWORD=CHANGE_ME"

rem  1 = show the browser while recording, 0 = record in the background
set "DEMO_HEADED=1"
rem  1 = phone-size video, 0 = desktop-size video
set "DEMO_PHONE=0"
rem ============================================================

echo.
echo  Swat Tourism - demo video recorder
echo  ------------------------------------

if not exist "record_demo.py" (
  echo  [!] record_demo.py is not in this folder.
  echo      Put record_demo.bat and record_demo.py in the same folder.
  pause
  exit /b 1
)

set "PY="
python --version >nul 2>nul
if not errorlevel 1 set "PY=python"
if not defined PY (
  py --version >nul 2>nul
  if not errorlevel 1 set "PY=py"
)
if not defined PY (
  echo  [!] Python is not installed.
  echo      Install it from https://www.python.org/downloads/ and tick "Add Python to PATH",
  echo      then run this file again.
  pause
  exit /b 1
)

where curl >nul 2>nul
if not errorlevel 1 (
  curl -s -o nul --max-time 8 "%DEMO_BASE_URL%"
  if errorlevel 1 (
    echo  [!] The app is not reachable at %DEMO_BASE_URL%
    echo      Start the frontend and the backend first, then run this file again.
    pause
    exit /b 1
  )
)

echo.
echo  Step 1 of 3: installing the recording tools. This takes a few minutes the first time.
%PY% -m pip install --quiet --disable-pip-version-check playwright
if errorlevel 1 (
  echo  [!] Could not install Playwright. Check your internet connection and try again.
  pause
  exit /b 1
)
%PY% -m playwright install chromium
if errorlevel 1 (
  echo  [!] Could not download the browser. Check your internet connection and try again.
  pause
  exit /b 1
)

where ffmpeg >nul 2>nul
if errorlevel 1 (
  where winget >nul 2>nul
  if not errorlevel 1 (
    echo.
    echo  ffmpeg is needed to join the clips into one MP4 file.
    choice /c YN /m " Install ffmpeg now"
    if not errorlevel 2 winget install --id Gyan.FFmpeg -e --silent --accept-package-agreements --accept-source-agreements
  )
)

echo.
echo  Step 2 of 3: recording. Please do not touch the browser window until it closes.
%PY% record_demo.py
set "RESULT=%errorlevel%"

echo.
echo  Step 3 of 3: done.
if not "%RESULT%"=="0" (
  echo  [!] The recorder stopped with an error. Read the messages above.
) else (
  echo  Your video is in the demo_videos folder: swat_demo.mp4
  echo  If there is no swat_demo.mp4, the separate clips are in the same folder.
  start "" explorer "%~dp0demo_videos"
)
echo.
pause
endlocal

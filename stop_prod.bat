@echo off
echo Stopping Swat Tourism Production services...
taskkill /F /FI "WINDOWTITLE eq Swat Tourism Prod Backend*"
taskkill /F /FI "WINDOWTITLE eq Swat Tourism Prod Frontend*"
echo Stopped successfully.

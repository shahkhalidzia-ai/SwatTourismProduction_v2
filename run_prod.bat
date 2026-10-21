@echo off
echo ===================================================
echo   SWAT TOURISM PLATFORM - PRODUCTION RUNNER
echo   Database:  SQLite with WAL (Write-Ahead Logging)
echo   Payment:   Easypaisa Gateway Active
echo ===================================================

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

echo [1/3] Verifying and Initializing Production Database...
cd backend
python -c "
import sys
sys.path.insert(0, '.')
from app.core.config import settings
from app.core.database import engine
print(f'Active DB Engine: {settings.DATABASE_URL}')
print(f'SQLite WAL Mode: {settings.SQLITE_WAL_MODE}')
"

echo [2/3] Starting Production FastAPI Backend on port 8090...
start "Swat Tourism Prod Backend" cmd /k "cd /d "%ROOT_DIR%backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8090 --reload"

echo [3/3] Starting Production Vite Frontend on port 5180...
start "Swat Tourism Prod Frontend" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run dev -- --port 5180"

echo ===================================================
echo Production System running!
echo Frontend: http://localhost:5180
echo Backend:  http://localhost:8090/docs
echo ===================================================

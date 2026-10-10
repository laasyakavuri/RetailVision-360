@echo off
REM ==============================================================================
REM RetailVision 360 — Windows Startup Script
REM ==============================================================================

echo ==========================================================
echo  Starting RetailVision 360 — Multimodal Retail Intelligence
echo ==========================================================

set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%backend
set FRONTEND_DIR=%SCRIPT_DIR%frontend

REM 1. Verify Prerequisites
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] python could not be found. Please install Python 3.10+.
    pause
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] node could not be found. Please install Node.js 18+.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm could not be found. Please install npm.
    pause
    exit /b 1
)

echo [OK] Python and Node.js environments verified.

REM 2. Setup Backend Virtual Environment & Dependencies
echo [*] Setting up Backend...
cd /d "%BACKEND_DIR%"

if not exist "venv" (
    echo [*] Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
echo [*] Installing backend dependencies...
pip install -r requirements.txt -q

if not exist ".env" (
    if exist ".env.example" (
        echo [*] Creating .env from .env.example...
        copy .env.example .env >nul
    )
)

echo [*] Initializing database and verifying demo records...
python -c "from app.services.seed_data import seed_demo_data; seed_demo_data()"

REM 3. Setup Frontend Dependencies
echo [*] Setting up Frontend...
cd /d "%FRONTEND_DIR%"

if not exist "node_modules" (
    echo [*] Installing frontend npm dependencies...
    call npm install
)

REM 4. Launch Services in Separate Windows
echo ==========================================================
echo  Launching RetailVision 360 Services
echo  Backend:  http://localhost:8000 (API Docs: http://localhost:8000/docs)
echo  Frontend: http://localhost:5173
echo ==========================================================

start "RetailVision 360 - Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && call venv\Scripts\activate.bat && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

start "RetailVision 360 - Frontend" cmd /k "cd /d ""%FRONTEND_DIR%"" && call npm run dev -- --host 0.0.0.0 --port 5173"

echo [OK] RetailVision 360 launched successfully.
pause

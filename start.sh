#!/usr/bin/env bash
# ==============================================================================
# RetailVision 360 — Ubuntu / Linux Startup Script
# ==============================================================================
set -e

echo "=========================================================="
echo " Starting RetailVision 360 — Multimodal Retail Intelligence"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/backend"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"

# 1. Verify Prerequisites
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 could not be found. Please install Python 3.10+."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "[ERROR] node could not be found. Please install Node.js 18+."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm could not be found. Please install npm."
    exit 1
fi

echo "[✓] Python and Node.js environments verified."

# 2. Setup Backend Virtual Environment & Dependencies
echo "[*] Setting up Backend..."
cd "${BACKEND_DIR}"

if [ ! -d "venv" ]; then
    echo "[*] Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "[*] Installing backend dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
    echo "[*] Creating .env from .env.example..."
    cp .env.example .env
fi

echo "[*] Initializing database and verifying demo records..."
python -c "from app.services.seed_data import seed_demo_data; seed_demo_data()"

# 3. Setup Frontend Dependencies
echo "[*] Setting up Frontend..."
cd "${FRONTEND_DIR}"

if [ ! -d "node_modules" ]; then
    echo "[*] Installing frontend npm dependencies..."
    npm install
fi

# 4. Launch Servers with Graceful Shutdown Trap
echo "=========================================================="
echo " Launching RetailVision 360 Services"
echo " Backend:  http://localhost:8000 (API Docs: http://localhost:8000/docs)"
echo " Frontend: http://localhost:5173"
echo "=========================================================="

cleanup() {
    echo ""
    echo "[*] Shutting down RetailVision 360..."
    kill "$BACKEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
    echo "[✓] Services stopped cleanly."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start backend
cd "${BACKEND_DIR}"
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend
cd "${FRONTEND_DIR}"
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo "[✓] RetailVision 360 is running. Press Ctrl+C to terminate."
wait

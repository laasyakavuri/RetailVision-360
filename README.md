# RetailVision 360 — AI-Powered Multimodal Retail Intelligence

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![Ultralytics](https://img.shields.io/badge/YOLOv8-Nano%20(CPU)-00599C.svg?style=flat)](https://ultralytics.com)
[![Google GenAI](https://img.shields.io/badge/Google%20GenAI-gemini--2.5--flash-4285F4.svg?style=flat&logo=google)](https://ai.google.dev)
[![Tests](https://img.shields.io/badge/pytest-11%2F11%20passing-brightgreen.svg?style=flat)](docs/TEST_REPORT.md)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)](LICENSE)

**RetailVision 360** is a full-stack, multimodal retail intelligence platform engineered around the flagship paradigm of **Shelf-to-Action Intelligence**. 

Unlike conventional passive camera tools that merely generate unverified notifications, RetailVision 360 executes a closed-loop operational workflow:
$$\text{Capture} \longrightarrow \text{Detect} \longrightarrow \text{Compare} \longrightarrow \text{Diagnose} \longrightarrow \text{Prioritize} \longrightarrow \text{Create Task} \longrightarrow \text{Act} \longrightarrow \text{Verify} \longrightarrow \text{Resolve}$$

---

## 🌟 The Five Differentiating Innovations

1. **Expected-vs-Observed Planogram Comparison**: Decomposes physical shelf space into structured spatial grids, comparing detected facings against expected layouts and flagging empty slots without hallucinating SKU identities.
2. **Small-Catalog Product Recognition with Honest Uncertainty**: Combines normalized 3D HSV color histograms and ORB keypoint descriptors. Distinguishes high-confidence matches ($\ge 0.55$) from ambiguous detections, explicitly flagging uncertain items for human review.
3. **Inventory-Aware Diagnosis Engine**: Cross-references optical shelf deficits with persistent ERP backroom records. Differentiates between operational restocking tasks (stock exists in backroom) and supply-chain stockouts (stock is zero everywhere).
4. **Explainable Operational Priority Engine**: Replaces opaque machine learning scores with a transparent 5-factor mathematical formula incorporating shelf gap severity (35%), sales velocity (25%), backroom stock availability (20%), task age (10%), and visual evidence confidence (10%).
5. **Closed-Loop Task Verification**: Associates cannot dismiss shelf tasks with a button click. Resolution requires uploading a post-remediation photograph, which is optically audited by computer vision to verify target facings before closing the task.

---

## 🏗️ System Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, React Router v7.
- **Backend**: Python 3.11, FastAPI, Pydantic v2, SQLAlchemy ORM, SQLite.
- **Computer Vision**: Ultralytics YOLOv8n (CPU-optimized, ~185ms latency), OpenCV, Pillow.
- **AI Copilot**: Official `google-genai` Python SDK, `gemini-2.5-flash`, database-grounded context retrieval, server-side secure key management.

```
RetailVision360/
├── backend/
│   ├── app/
│   │   ├── api/          # REST endpoints
│   │   ├── core/         # Settings, thresholds, CPU config
│   │   ├── database/     # SQLite engine & sessions
│   │   ├── models/       # SQLAlchemy relational entities
│   │   ├── schemas/      # Pydantic validation models
│   │   ├── services/     # Diagnosis, Priority, Task, Gemini Context services
│   │   └── vision/       # YOLOv8 detector, HSV/ORB matcher, planogram grid
│   ├── tests/            # Automated pytest suite (11/11 passing)
│   ├── .env.example      # Environment template (Gemini API key)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Sidebar, Navbar, Gemini Drawer
│   │   ├── pages/        # 15 interactive application pages
│   │   ├── services/     # Typed Axios API client
│   │   └── types/        # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── sample_data/          # Canonical shelf images & reference product catalog
├── docs/                 # Complete architecture, API, evaluation & demo guides
├── start.sh              # Ubuntu/Linux startup script
├── start.bat             # Windows startup script
└── README.md
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.11.4)
- **Node.js**: 18+ (tested on Node v22.20.0, npm 10.9.3)
- **Hardware**: Standard x86_64 CPU (no dedicated GPU or CUDA required)

### Option A: Using Startup Scripts

#### On Ubuntu / Debian Linux:
```bash
chmod +x start.sh
./start.sh
```

#### On Windows:
```cmd
start.bat
```

The startup script will automatically initialize the Python virtual environment, install requirements, seed the SQLite database, install frontend packages, and launch both servers.

---

### Option B: Manual Step-by-Step Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv

# On Linux/macOS:
source venv/bin/activate
# On Windows:
.\venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env

# (Optional) Add your Google AI Studio Gemini API key to .env:
# GEMINI_API_KEY=your_key_here
# GEMINI_MODEL=gemini-2.5-flash

# Initialize database and seed demo data:
python -c "from app.services.seed_data import seed_demo_data; seed_demo_data()"

# Start FastAPI backend:
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
cd ../frontend
npm install
npm run build   # Verifies TypeScript compilation
npm run dev     # Starts Vite development server at http://localhost:5173
```

Access the application:
- **Web Dashboard**: `http://localhost:5173`
- **Interactive Swagger API Docs**: `http://localhost:8000/docs`

---

## 🤖 Gemini AI Copilot Setup

The AI Copilot operates via backend-only requests using the official `google-genai` SDK:
1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/api-keys).
2. Configure `GEMINI_API_KEY` in `backend/.env`.
3. Check status at `http://localhost:8000/api/chat/status`.
4. Open the floating **AI Copilot** in the dashboard to ask database-grounded questions such as:
   - *"Which shelves require immediate restocking?"*
   - *"Why is task T-001 prioritized over T-002?"*
   - *"Summarize today's checkout discrepancies."*

> Note: If the Gemini API key is omitted, all other modules (CV audits, planograms, tasks, verification, analytics) function completely normally.

---

## 🧪 Automated Testing

Run the full backend test suite:
```bash
cd backend
pytest tests/test_api.py -v
```

**Results**: 11 passed out of 11 tests in 23.52s (including genuine YOLOv8 inference and live Gemini API execution). See [docs/TEST_REPORT.md](docs/TEST_REPORT.md).

---

## 📖 Comprehensive Documentation

- [System Architecture & Mermaid Diagrams](docs/ARCHITECTURE.md)
- [REST API Reference](docs/API.md)
- [5-Minute Competition Demo Walkthrough](docs/DEMO_GUIDE.md)
- [Gemini Configuration & Security](docs/GEMINI_SETUP.md)
- [Technical Evaluation & Benchmarks](docs/EVALUATION.md)
- [Automated Test Execution Report](docs/TEST_REPORT.md)
- [Known Limitations & Disclosures](docs/KNOWN_LIMITATIONS.md)

---

## 🔒 Security & Privacy Disclosures

- **Zero Client-Side Secrets**: API keys are isolated exclusively in server environment variables.
- **Privacy-Preserving**: Heatmaps and store dwell metrics use anonymous centroid points. No biometric data, facial recognition, or demographic profiling is implemented.
- **Discrepancy Ethics**: POS scanning variances are treated as inventory discrepancies requiring review, never as automated accusations of theft.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

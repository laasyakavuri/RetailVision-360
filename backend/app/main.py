import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.api.router import router as api_router
from app.services.seed_data import seed_database

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="RetailVision 360: AI-Powered Multimodal Retail Intelligence & Shelf-to-Action Copilot",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend Vite dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static storage directory
if os.path.exists(settings.STORAGE_DIR):
    app.mount("/storage", StaticFiles(directory=str(settings.STORAGE_DIR)), name="storage")

# Include API Router
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        # Seed demo data idempotently on first startup
        seed_database(db, force_reset=False)
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "message": "RetailVision 360 API is running",
        "docs": "/docs",
        "system_status": "/api/system/status"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

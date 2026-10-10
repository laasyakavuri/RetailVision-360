import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RetailVision 360"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Base directories
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOADS_DIR: Path = STORAGE_DIR / "uploads"
    ANNOTATIONS_DIR: Path = STORAGE_DIR / "annotated"
    SAMPLE_DATA_DIR: Path = BASE_DIR.parent / "sample_data"
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/retailvision360.db"
    
    # Gemini AI configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    # Computer Vision Configuration
    YOLO_MODEL_NAME: str = "yolov8n.pt"  # Lightweight nano model
    INFERENCE_DEVICE: str = "cpu"        # Default to CPU execution
    CONFIDENCE_THRESHOLD: float = 0.25
    IOU_THRESHOLD: float = 0.45
    
    # Shelf Analytics Thresholds
    DEFAULT_OCCUPANCY_TARGET: float = 0.75  # 75% target occupancy
    CRITICAL_GAP_THRESHOLD: float = 0.40    # Below 40% is critical gap
    
    # Operational Priority Weights
    WEIGHT_GAP_SEVERITY: float = 0.35
    WEIGHT_SALES_VELOCITY: float = 0.25
    WEIGHT_BACKROOM_STOCK: float = 0.20
    WEIGHT_TASK_AGE: float = 0.10
    WEIGHT_EVIDENCE_CONFIDENCE: float = 0.10

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
settings.ANNOTATIONS_DIR.mkdir(parents=True, exist_ok=True)

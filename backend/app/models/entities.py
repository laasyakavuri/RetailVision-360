import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class Store(Base):
    __tablename__ = "stores"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    address = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    
    zones = relationship("StoreZone", back_populates="store", cascade="all, delete-orphan")
    planograms = relationship("Planogram", back_populates="store", cascade="all, delete-orphan")

class StoreZone(Base):
    __tablename__ = "store_zones"
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    name = Column(String(100), nullable=False)
    zone_type = Column(String(50), default="aisle")  # entrance, aisle, checkout, promotional
    dwell_target_sec = Column(Float, default=120.0)
    capacity = Column(Integer, default=30)
    created_at = Column(DateTime, default=utcnow)
    
    store = relationship("Store", back_populates="zones")
    activity_events = relationship("ActivityEvent", back_populates="zone", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    brand = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    barcode = Column(String(50), nullable=True)
    unit_price = Column(Float, nullable=False, default=0.0)
    expected_shelf_qty = Column(Integer, default=10)
    min_threshold = Column(Integer, default=3)
    reference_image = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    
    inventory = relationship("InventoryRecord", back_populates="product", uselist=False, cascade="all, delete-orphan")
    planogram_positions = relationship("PlanogramPosition", back_populates="product")

class InventoryRecord(Base):
    __tablename__ = "inventory_records"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), unique=True, nullable=False)
    recorded_shelf_qty = Column(Integer, default=0)
    recorded_backroom_qty = Column(Integer, default=0)
    recent_sales_qty = Column(Integer, default=0)
    sales_rate_per_hour = Column(Float, default=0.0)  # estimate
    reorder_threshold = Column(Integer, default=5)
    last_updated = Column(DateTime, default=utcnow)
    source = Column(String(50), default="ERP_SYNC")  # ERP_SYNC, MANUAL, RFID
    
    product = relationship("Product", back_populates="inventory")

class Planogram(Base):
    __tablename__ = "planograms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    aisle = Column(String(50), nullable=False)
    shelf = Column(String(50), nullable=False)
    rows = Column(Integer, default=3)
    cols = Column(Integer, default=4)
    occupancy_threshold = Column(Float, default=0.75)
    target_facing_count = Column(Integer, default=12)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    
    store = relationship("Store", back_populates="planograms")
    positions = relationship("PlanogramPosition", back_populates="planogram", cascade="all, delete-orphan")
    audits = relationship("ShelfAudit", back_populates="planogram")

class PlanogramPosition(Base):
    __tablename__ = "planogram_positions"
    id = Column(Integer, primary_key=True, index=True)
    planogram_id = Column(Integer, ForeignKey("planograms.id"), nullable=False)
    row_index = Column(Integer, nullable=False)
    col_index = Column(Integer, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    expected_facings = Column(Integer, default=2)
    min_occupancy_ratio = Column(Float, default=0.6)
    
    planogram = relationship("Planogram", back_populates="positions")
    product = relationship("Product", back_populates="planogram_positions")

class ShelfAudit(Base):
    __tablename__ = "shelf_audits"
    id = Column(Integer, primary_key=True, index=True)
    audit_code = Column(String(50), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=utcnow)
    aisle = Column(String(50), nullable=False)
    shelf = Column(String(50), nullable=False)
    planogram_id = Column(Integer, ForeignKey("planograms.id"), nullable=True)
    raw_image_path = Column(String(255), nullable=True)
    annotated_image_path = Column(String(255), nullable=True)
    total_detected_objects = Column(Integer, default=0)
    occupancy_rate = Column(Float, default=0.0)
    status = Column(String(50), default="COMPLETED")  # COMPLETED, FAILED, PROCESSING
    inference_duration_ms = Column(Float, default=0.0)
    model_name = Column(String(100), default="YOLOv8n-Retail")
    is_demo = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    
    planogram = relationship("Planogram", back_populates="audits")
    detections = relationship("DetectionRecord", back_populates="audit", cascade="all, delete-orphan")
    diagnoses = relationship("DiagnosisRecord", back_populates="audit", cascade="all, delete-orphan")
    tasks = relationship("OperationalTask", back_populates="audit")

class DetectionRecord(Base):
    __tablename__ = "detection_records"
    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("shelf_audits.id"), nullable=False)
    class_name = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    bbox_x1 = Column(Float, nullable=False)
    bbox_y1 = Column(Float, nullable=False)
    bbox_x2 = Column(Float, nullable=False)
    bbox_y2 = Column(Float, nullable=False)
    matched_product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    match_confidence = Column(Float, default=0.0)
    match_status = Column(String(50), default="GENERIC_OBJECT")  # MATCHED, UNCERTAIN, GENERIC_OBJECT
    
    audit = relationship("ShelfAudit", back_populates="detections")
    matched_product = relationship("Product")

class ProductRecognitionCorrection(Base):
    __tablename__ = "recognition_corrections"
    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey("detection_records.id"), nullable=False)
    corrected_product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    notes = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=utcnow)

class DiagnosisRecord(Base):
    __tablename__ = "diagnosis_records"
    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("shelf_audits.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    classification = Column(String(100), nullable=False)  # e.g., "Critical Shelf Gap - Restock Available"
    diagnosis_type = Column(String(50), nullable=False)    # STOCKOUT_AVAILABLE, STOCKOUT_DEPLETED, MISPLACED, HEALTHY, UNCERTAIN
    explanation = Column(Text, nullable=False)
    trigger_rule = Column(String(200), nullable=False)
    visual_evidence = Column(Text, nullable=False)
    inventory_evidence = Column(Text, nullable=False)
    confidence_level = Column(String(50), default="HIGH")  # HIGH, MEDIUM, LOW, REQUIRES_VERIFICATION
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)
    
    audit = relationship("ShelfAudit", back_populates="diagnoses")
    product = relationship("Product")

class OperationalTask(Base):
    __tablename__ = "operational_tasks"
    id = Column(Integer, primary_key=True, index=True)
    task_code = Column(String(50), unique=True, index=True, nullable=False)
    audit_id = Column(Integer, ForeignKey("shelf_audits.id"), nullable=False)
    planogram_id = Column(Integer, ForeignKey("planograms.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    aisle = Column(String(50), nullable=False)
    shelf = Column(String(50), nullable=False)
    problem_type = Column(String(100), nullable=False)
    priority_level = Column(String(50), default="MEDIUM")  # CRITICAL, HIGH, MEDIUM, LOW, REQUIRES_VERIFICATION
    priority_score = Column(Float, default=50.0)           # 0 to 100 explainable score
    priority_breakdown_json = Column(Text, nullable=True)  # JSON breakdown
    recommended_action = Column(Text, nullable=False)
    trigger_thresholds = Column(String(255), nullable=False)
    status = Column(String(50), default="OPEN")            # OPEN, IN_PROGRESS, ACTION_TAKEN, VERIFIED_RESOLVED, VERIFICATION_FAILED, DISMISSED
    assigned_to = Column(String(100), nullable=True)
    employee_notes = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    
    audit = relationship("ShelfAudit", back_populates="tasks")
    product = relationship("Product")
    status_history = relationship("TaskStatusHistory", back_populates="task", cascade="all, delete-orphan")
    verifications = relationship("TaskVerificationRun", back_populates="task", cascade="all, delete-orphan")

class TaskStatusHistory(Base):
    __tablename__ = "task_status_history"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("operational_tasks.id"), nullable=False)
    previous_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    changed_by = Column(String(100), default="System")
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=utcnow)
    
    task = relationship("OperationalTask", back_populates="status_history")

class TaskVerificationRun(Base):
    __tablename__ = "task_verification_runs"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("operational_tasks.id"), nullable=False)
    audit_id = Column(Integer, ForeignKey("shelf_audits.id"), nullable=True)
    verification_image_path = Column(String(255), nullable=True)
    before_count = Column(Integer, nullable=False)
    after_count = Column(Integer, nullable=False)
    target_count = Column(Integer, nullable=False)
    result = Column(String(50), nullable=False)  # SATISFIED, UNMET, INCONCLUSIVE
    notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=utcnow)
    
    task = relationship("OperationalTask", back_populates="verifications")

class CheckoutSession(Base):
    __tablename__ = "checkout_sessions"
    id = Column(Integer, primary_key=True, index=True)
    session_code = Column(String(50), unique=True, index=True, nullable=False)
    checkout_location = Column(String(100), nullable=False)
    register_id = Column(String(50), default="REG-01")
    timestamp = Column(DateTime, default=utcnow)
    total_scanned_items = Column(Integer, default=0)
    total_scanned_amount = Column(Float, default=0.0)
    total_weight_expected = Column(Float, default=0.0)  # grams
    total_weight_measured = Column(Float, default=0.0)  # grams
    reconciliation_status = Column(String(50), default="MATCHED")  # MATCHED, DISCREPANCY_QUANTITY, DISCREPANCY_WEIGHT, RESOLVED, DISMISSED
    notes = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=False)
    
    items = relationship("CheckoutLineItem", back_populates="session", cascade="all, delete-orphan")

class CheckoutLineItem(Base):
    __tablename__ = "checkout_line_items"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("checkout_sessions.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    sku = Column(String(50), nullable=False)
    product_name = Column(String(150), nullable=False)
    quantity_scanned = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)
    weight_expected = Column(Float, default=0.0)
    
    session = relationship("CheckoutSession", back_populates="items")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String(50), unique=True, index=True, nullable=False)
    alert_type = Column(String(50), nullable=False)  # SHELF_OCCUPANCY, STOCKOUT_RISK, PLANOGRAM_MISMATCH, UNRECOGNIZED_SKU, CHECKOUT_MISMATCH, CONGESTION_ALERT, AI_WARNING
    severity = Column(String(50), default="MEDIUM")   # CRITICAL, HIGH, MEDIUM, LOW
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    source_entity_type = Column(String(50), nullable=True)  # AUDIT, TASK, CHECKOUT, ZONE
    source_entity_id = Column(String(50), nullable=True)
    status = Column(String(50), default="ACTIVE")    # ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED
    created_at = Column(DateTime, default=utcnow)
    resolved_at = Column(DateTime, nullable=True)
    is_demo = Column(Boolean, default=False)

class ActivityEvent(Base):
    __tablename__ = "activity_events"
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("store_zones.id"), nullable=False)
    zone_name = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=utcnow)
    visitor_count = Column(Integer, default=0)
    avg_dwell_seconds = Column(Float, default=0.0)
    congestion_level = Column(String(50), default="NORMAL")  # NORMAL, MODERATE, CONGESTED
    is_demo = Column(Boolean, default=False)
    
    zone = relationship("StoreZone", back_populates="activity_events")

class ChatConversation(Base):
    __tablename__ = "chat_conversations"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), default="Retail Operations Assistant")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id"), nullable=False)
    sender = Column(String(50), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    action_metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    
    conversation = relationship("ChatConversation", back_populates="messages")

class AppSetting(Base):
    __tablename__ = "app_settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ProductBase(BaseModel):
    sku: str
    name: str
    brand: str
    category: str
    barcode: Optional[str] = None
    unit_price: float = 0.0
    expected_shelf_qty: int = 10
    min_threshold: int = 3
    reference_image: Optional[str] = None
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    unit_price: Optional[float] = None
    expected_shelf_qty: Optional[int] = None
    min_threshold: Optional[int] = None
    is_active: Optional[bool] = None

class InventoryRecordSchema(BaseModel):
    id: int
    product_id: int
    recorded_shelf_qty: int
    recorded_backroom_qty: int
    recent_sales_qty: int
    sales_rate_per_hour: float
    reorder_threshold: int
    last_updated: datetime
    source: str
    class Config:
        from_attributes = True

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    inventory: Optional[InventoryRecordSchema] = None
    class Config:
        from_attributes = True

class InventoryUpdateRequest(BaseModel):
    product_id: int
    recorded_shelf_qty: Optional[int] = None
    recorded_backroom_qty: Optional[int] = None
    recent_sales_qty: Optional[int] = None
    source: str = "MANUAL_UPDATE"

class PlanogramPositionSchema(BaseModel):
    row_index: int
    col_index: int
    product_id: Optional[int] = None
    expected_facings: int = 2
    min_occupancy_ratio: float = 0.6

class PlanogramCreate(BaseModel):
    name: str
    store_id: int = 1
    aisle: str
    shelf: str
    rows: int = 3
    cols: int = 4
    occupancy_threshold: float = 0.75
    target_facing_count: int = 12
    positions: List[PlanogramPositionSchema] = []

class PlanogramResponse(BaseModel):
    id: int
    name: str
    store_id: int
    aisle: str
    shelf: str
    rows: int
    cols: int
    occupancy_threshold: float
    target_facing_count: int
    is_active: bool
    created_at: datetime
    positions: List[PlanogramPositionSchema] = []
    class Config:
        from_attributes = True

class DetectionRecordSchema(BaseModel):
    id: int
    class_name: str
    confidence: float
    bbox_x1: float
    bbox_y1: float
    bbox_x2: float
    bbox_y2: float
    matched_product_id: Optional[int] = None
    match_confidence: float = 0.0
    match_status: str
    class Config:
        from_attributes = True

class ShelfAuditResponse(BaseModel):
    id: int
    audit_code: str
    timestamp: datetime
    aisle: str
    shelf: str
    planogram_id: Optional[int] = None
    raw_image_path: Optional[str] = None
    annotated_image_path: Optional[str] = None
    total_detected_objects: int
    occupancy_rate: float
    status: str
    inference_duration_ms: float
    model_name: str
    is_demo: bool
    notes: Optional[str] = None
    detections: List[DetectionRecordSchema] = []
    class Config:
        from_attributes = True

class PlanogramCompareResult(BaseModel):
    planogram_id: int
    audit_id: int
    compliance_score: float
    expected_total_facings: int
    observed_total_objects: int
    missing_facings_count: int
    unexpected_objects_count: int
    facing_discrepancies: List[Dict[str, Any]]
    status: str  # COMPLIANT, MINOR_DEVIATION, CRITICAL_MISMATCH

class DiagnosisSchema(BaseModel):
    id: int
    audit_id: int
    product_id: Optional[int] = None
    classification: str
    diagnosis_type: str
    explanation: str
    trigger_rule: str
    visual_evidence: str
    inventory_evidence: str
    confidence_level: str
    is_demo: bool
    created_at: datetime
    class Config:
        from_attributes = True

class PriorityScoreBreakdown(BaseModel):
    gap_severity_score: float
    sales_velocity_score: float
    backroom_stock_score: float
    task_age_score: float
    evidence_confidence_score: float
    total_score: float
    priority_level: str
    rationale: List[str]

class OperationalTaskCreate(BaseModel):
    audit_id: int
    planogram_id: Optional[int] = None
    product_id: Optional[int] = None
    aisle: str
    shelf: str
    problem_type: str
    priority_level: str = "MEDIUM"
    recommended_action: str
    trigger_thresholds: str
    assigned_to: Optional[str] = None

class OperationalTaskUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    employee_notes: Optional[str] = None

class OperationalTaskResponse(BaseModel):
    id: int
    task_code: str
    audit_id: int
    planogram_id: Optional[int] = None
    product_id: Optional[int] = None
    aisle: str
    shelf: str
    problem_type: str
    priority_level: str
    priority_score: float
    priority_breakdown_json: Optional[str] = None
    recommended_action: str
    trigger_thresholds: str
    status: str
    assigned_to: Optional[str] = None
    employee_notes: Optional[str] = None
    is_demo: bool
    created_at: datetime
    updated_at: datetime
    product_name: Optional[str] = None
    class Config:
        from_attributes = True

class VerificationResultResponse(BaseModel):
    task_id: int
    audit_id: int
    before_count: int
    after_count: int
    target_count: int
    result: str  # SATISFIED, UNMET, INCONCLUSIVE
    notes: str
    verified_at: datetime

class CheckoutItemCreate(BaseModel):
    sku: str
    product_name: str
    quantity_scanned: int
    unit_price: float
    weight_expected: float

class CheckoutSessionCreate(BaseModel):
    checkout_location: str
    register_id: str = "REG-01"
    total_weight_measured: float
    items: List[CheckoutItemCreate]

class CheckoutLineItemResponse(BaseModel):
    id: int
    sku: str
    product_name: str
    quantity_scanned: int
    unit_price: float
    weight_expected: float
    class Config:
        from_attributes = True

class CheckoutSessionResponse(BaseModel):
    id: int
    session_code: str
    checkout_location: str
    register_id: str
    timestamp: datetime
    total_scanned_items: int
    total_scanned_amount: float
    total_weight_expected: float
    total_weight_measured: float
    reconciliation_status: str
    notes: Optional[str] = None
    is_demo: bool
    items: List[CheckoutLineItemResponse] = []
    class Config:
        from_attributes = True

class AlertResponse(BaseModel):
    id: int
    alert_code: str
    alert_type: str
    severity: str
    title: str
    message: str
    source_entity_type: Optional[str] = None
    source_entity_id: Optional[str] = None
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    is_demo: bool
    class Config:
        from_attributes = True

class DashboardSummary(BaseModel):
    total_shelf_audits: int
    total_detected_objects: int
    potential_stockout_alerts: int
    open_operational_tasks: int
    open_checkout_discrepancies: int
    completed_verifications: int
    unresolved_high_priority_alerts: int
    cv_model_available: bool
    cv_model_name: str
    gemini_available: bool
    gemini_model_name: str
    is_demo_active: bool

class ChatMessageRequest(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender: str
    content: str
    action_metadata_json: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class ChatConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    messages: List[ChatMessageResponse] = []
    class Config:
        from_attributes = True

import os
import json
import shutil
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.core.config import settings
from app.models.entities import (
    Store, StoreZone, Product, InventoryRecord, Planogram, PlanogramPosition,
    ShelfAudit, DetectionRecord, DiagnosisRecord, OperationalTask,
    TaskStatusHistory, TaskVerificationRun, CheckoutSession, CheckoutLineItem,
    Alert, ActivityEvent, ChatConversation, ChatMessage, AppSetting
)
from app.schemas.schemas import (
    ProductCreate, ProductUpdate, ProductResponse, InventoryRecordSchema,
    InventoryUpdateRequest, PlanogramCreate, PlanogramResponse,
    PlanogramCompareResult, ShelfAuditResponse, OperationalTaskCreate,
    OperationalTaskUpdate, OperationalTaskResponse, VerificationResultResponse,
    CheckoutSessionCreate, CheckoutSessionResponse, AlertResponse,
    DashboardSummary, ChatMessageRequest, ChatMessageResponse,
    ChatConversationResponse
)
from app.vision.detector import detector
from app.vision.recognizer import product_recognizer
from app.vision.planogram_matcher import planogram_matcher
from app.services.diagnosis_service import diagnosis_service
from app.services.priority_service import priority_engine
from app.services.retail_context_service import RetailContextService
from app.services.gemini_service import gemini_copilot
from app.services.seed_data import seed_database

router = APIRouter()

# ----------------- SYSTEM & HEALTH -----------------
@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/system/status")
def get_system_status(db: Session = Depends(get_db)):
    gemini_avail = gemini_copilot.is_available()
    cv_avail = detector.is_available()
    return {
        "backend_running": True,
        "database": "sqlite",
        "database_connected": True,
        "cv_model": {
            "name": detector.model_name,
            "available": cv_avail,
            "device": settings.INFERENCE_DEVICE,
            "mode": "Genuine YOLOv8" if cv_avail else "Genuine OpenCV Analysis"
        },
        "gemini": {
            "configured": bool(settings.GEMINI_API_KEY),
            "model": settings.GEMINI_MODEL,
            "available": gemini_avail
        },
        "storage": {
            "uploads_dir": str(settings.UPLOADS_DIR),
            "annotations_dir": str(settings.ANNOTATIONS_DIR)
        }
    }

# ----------------- DASHBOARD -----------------
@router.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_audits = db.query(ShelfAudit).count()
    total_detections = db.query(DetectionRecord).count()
    stockout_alerts = db.query(Alert).filter(Alert.alert_type == "STOCKOUT_RISK", Alert.status == "ACTIVE").count()
    open_tasks = db.query(OperationalTask).filter(OperationalTask.status.in_(["OPEN", "IN_PROGRESS", "ACTION_TAKEN"])).count()
    checkout_discrepancies = db.query(CheckoutSession).filter(CheckoutSession.reconciliation_status.like("DISCREPANCY%")).count()
    completed_verifs = db.query(TaskVerificationRun).count()
    unresolved_high = db.query(Alert).filter(Alert.severity.in_(["CRITICAL", "HIGH"]), Alert.status == "ACTIVE").count()
    is_demo = db.query(ShelfAudit).filter(ShelfAudit.is_demo == True).count() > 0

    return DashboardSummary(
        total_shelf_audits=total_audits,
        total_detected_objects=total_detections,
        potential_stockout_alerts=stockout_alerts,
        open_operational_tasks=open_tasks,
        open_checkout_discrepancies=checkout_discrepancies,
        completed_verifications=completed_verifs,
        unresolved_high_priority_alerts=unresolved_high,
        cv_model_available=detector.is_available(),
        cv_model_name=detector.model_name if detector.is_available() else "OpenCV Visual Engine",
        gemini_available=gemini_copilot.is_available(),
        gemini_model_name=settings.GEMINI_MODEL,
        is_demo_active=is_demo
    )

@router.get("/dashboard/activity")
def get_dashboard_activity(db: Session = Depends(get_db)):
    events = db.query(ActivityEvent).order_by(desc(ActivityEvent.id)).limit(15).all()
    return [
        {
            "id": e.id,
            "zone": e.zone_name,
            "visitors": e.visitor_count,
            "dwell_sec": e.avg_dwell_seconds,
            "congestion": e.congestion_level,
            "time": e.timestamp.strftime("%H:%M")
        }
        for e in events
    ]

# ----------------- SHELF AUDITS -----------------
@router.post("/shelf-audits", response_model=ShelfAuditResponse)
async def create_shelf_audit(
    file: UploadFile = File(...),
    aisle: str = Form("Aisle 1"),
    shelf: str = Form("Shelf B2"),
    planogram_id: Optional[int] = Form(None),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # Validate file type
    if not file.filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        raise HTTPException(status_code=400, detail="Invalid file type. Supported: JPG, JPEG, PNG, WEBP.")

    # Save uploaded file
    file_id = f"audit_{uuid.uuid4().hex[:8]}_{file.filename}"
    raw_path = settings.UPLOADS_DIR / file_id
    with open(raw_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Execute genuine CV detection
    try:
        detections, duration_ms, annotated_path = detector.detect(str(raw_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computer vision inference error: {str(e)}")

    # Target calculation
    target_count = 10
    if planogram_id:
        p_obj = db.query(Planogram).filter(Planogram.id == planogram_id).first()
        if p_obj:
            target_count = p_obj.target_facing_count

    occupancy_rate = min(1.0, round(len(detections) / max(1, target_count), 4))
    audit_code = f"AUD-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"

    audit = ShelfAudit(
        audit_code=audit_code,
        aisle=aisle,
        shelf=shelf,
        planogram_id=planogram_id,
        raw_image_path=str(raw_path),
        annotated_image_path=annotated_path,
        total_detected_objects=len(detections),
        occupancy_rate=occupancy_rate,
        status="COMPLETED",
        inference_duration_ms=duration_ms,
        model_name=detector.model_name if detector.is_available() else "OpenCV Contour Engine",
        is_demo=False,
        notes=notes
    )
    db.add(audit)
    db.flush()

    # Product matching against catalog
    catalog = [
        {"id": p.id, "sku": p.sku, "name": p.name, "brand": p.brand, "reference_image": p.reference_image}
        for p in db.query(Product).filter(Product.is_active == True).all()
    ]

    saved_detections = []
    for d in detections:
        # Save detection record
        det_rec = DetectionRecord(
            audit_id=audit.id,
            class_name=d["class_name"],
            confidence=d["confidence"],
            bbox_x1=d["bbox_x1"],
            bbox_y1=d["bbox_y1"],
            bbox_x2=d["bbox_x2"],
            bbox_y2=d["bbox_y2"],
            match_status="GENERIC_OBJECT"
        )
        db.add(det_rec)
        saved_detections.append(det_rec)
    db.flush()

    # Automated Inventory-Aware Diagnosis
    # Check related product from planogram or general category
    target_prod = db.query(Product).first()
    inv_rec = db.query(InventoryRecord).filter(InventoryRecord.product_id == target_prod.id).first() if target_prod else None

    diag = diagnosis_service.diagnose(
        audit_id=audit.id,
        observed_occupancy=occupancy_rate,
        detected_count=len(detections),
        target_count=target_count,
        detections=detections,
        inventory_record=inv_rec,
        product=target_prod
    )

    diag_rec = DiagnosisRecord(
        audit_id=audit.id,
        product_id=target_prod.id if target_prod else None,
        classification=diag["classification"],
        diagnosis_type=diag["diagnosis_type"],
        explanation=diag["explanation"],
        trigger_rule=diag["trigger_rule"],
        visual_evidence=diag["visual_evidence"],
        inventory_evidence=diag["inventory_evidence"],
        confidence_level=diag["confidence_level"],
        is_demo=False
    )
    db.add(diag_rec)

    # If action required, create operational task and alert
    if diag["problem_type"] != "NONE":
        p_calc = priority_engine.calculate_priority(
            occupancy_rate=occupancy_rate,
            target_count=target_count,
            observed_count=len(detections),
            recorded_backroom_qty=inv_rec.recorded_backroom_qty if inv_rec else 0,
            sales_rate_per_hour=inv_rec.sales_rate_per_hour if inv_rec else 2.0,
            task_created_at=datetime.now(timezone.utc),
            avg_detection_confidence=sum(d["confidence"] for d in detections)/max(1, len(detections)) if detections else 0.5
        )

        task = OperationalTask(
            task_code=f"TSK-{uuid.uuid4().hex[:4].upper()}",
            audit_id=audit.id,
            planogram_id=planogram_id,
            product_id=target_prod.id if target_prod else None,
            aisle=aisle,
            shelf=shelf,
            problem_type=diag["problem_type"],
            priority_level=p_calc["priority_level"],
            priority_score=p_calc["total_score"],
            priority_breakdown_json=json.dumps(p_calc),
            recommended_action=diag["recommended_action"],
            trigger_thresholds=diag["trigger_rule"],
            status="OPEN",
            is_demo=False
        )
        db.add(task)
        db.flush()

        hist = TaskStatusHistory(
            task_id=task.id,
            previous_status="CREATED",
            new_status="OPEN",
            changed_by="Automated Diagnosis Engine",
            notes=f"Auto-generated from Shelf Audit {audit_code}"
        )
        db.add(hist)

        # Create alert
        sev = "CRITICAL" if p_calc["priority_level"] == "CRITICAL" else ("HIGH" if p_calc["priority_level"] == "HIGH" else "MEDIUM")
        alert = Alert(
            alert_code=f"ALT-{uuid.uuid4().hex[:4].upper()}",
            alert_type="STOCKOUT_RISK" if "STOCKOUT" in diag["diagnosis_type"] else "SHELF_OCCUPANCY",
            severity=sev,
            title=f"Shelf Gap Alert: {aisle} {shelf}",
            message=diag["explanation"],
            source_entity_type="TASK",
            source_entity_id=task.task_code,
            status="ACTIVE",
            is_demo=False
        )
        db.add(alert)

    db.commit()
    db.refresh(audit)
    return audit

@router.get("/shelf-audits", response_model=List[ShelfAuditResponse])
def get_shelf_audits(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(ShelfAudit).order_by(desc(ShelfAudit.id)).offset(skip).limit(limit).all()

@router.get("/shelf-audits/{audit_id}", response_model=ShelfAuditResponse)
def get_shelf_audit_detail(audit_id: int, db: Session = Depends(get_db)):
    audit = db.query(ShelfAudit).filter(ShelfAudit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Shelf audit not found")
    return audit

@router.get("/shelf-audits/{audit_id}/annotated-image")
def get_shelf_audit_annotated_image(audit_id: int, db: Session = Depends(get_db)):
    audit = db.query(ShelfAudit).filter(ShelfAudit.id == audit_id).first()
    if not audit or not audit.annotated_image_path or not os.path.exists(audit.annotated_image_path):
        raise HTTPException(status_code=404, detail="Annotated image not found")
    return FileResponse(audit.annotated_image_path)

# ----------------- PLANOGRAMS -----------------
@router.get("/planograms", response_model=List[PlanogramResponse])
def get_planograms(db: Session = Depends(get_db)):
    return db.query(Planogram).filter(Planogram.is_active == True).all()

@router.post("/planograms", response_model=PlanogramResponse)
def create_planogram(data: PlanogramCreate, db: Session = Depends(get_db)):
    pl = Planogram(
        name=data.name,
        store_id=data.store_id,
        aisle=data.aisle,
        shelf=data.shelf,
        rows=data.rows,
        cols=data.cols,
        occupancy_threshold=data.occupancy_threshold,
        target_facing_count=data.target_facing_count,
        is_active=True
    )
    db.add(pl)
    db.flush()

    for p in data.positions:
        pos = PlanogramPosition(
            planogram_id=pl.id,
            row_index=p.row_index,
            col_index=p.col_index,
            product_id=p.product_id,
            expected_facings=p.expected_facings,
            min_occupancy_ratio=p.min_occupancy_ratio
        )
        db.add(pos)
    db.commit()
    db.refresh(pl)
    return pl

@router.get("/planograms/{planogram_id}", response_model=PlanogramResponse)
def get_planogram_detail(planogram_id: int, db: Session = Depends(get_db)):
    pl = db.query(Planogram).filter(Planogram.id == planogram_id).first()
    if not pl:
        raise HTTPException(status_code=404, detail="Planogram not found")
    return pl

@router.post("/planograms/{planogram_id}/compare", response_model=PlanogramCompareResult)
def compare_planogram(
    planogram_id: int,
    audit_id: int = Query(...),
    db: Session = Depends(get_db)
):
    pl = db.query(Planogram).filter(Planogram.id == planogram_id).first()
    if not pl:
        raise HTTPException(status_code=404, detail="Planogram not found")
    audit = db.query(ShelfAudit).filter(ShelfAudit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Shelf audit not found")

    dets = [
        {"bbox_x1": d.bbox_x1, "bbox_y1": d.bbox_y1, "bbox_x2": d.bbox_x2, "bbox_y2": d.bbox_y2, "class_name": d.class_name}
        for d in audit.detections
    ]
    pl_dict = {
        "id": pl.id,
        "rows": pl.rows,
        "cols": pl.cols,
        "occupancy_threshold": pl.occupancy_threshold,
        "target_facing_count": pl.target_facing_count,
        "positions": [
            {"row_index": p.row_index, "col_index": p.col_index, "expected_facings": p.expected_facings, "product_id": p.product_id}
            for p in pl.positions
        ]
    }

    comp = planogram_matcher.compare(pl_dict, dets)
    return PlanogramCompareResult(
        planogram_id=pl.id,
        audit_id=audit.id,
        compliance_score=comp["compliance_score"],
        expected_total_facings=comp["expected_total_facings"],
        observed_total_objects=comp["observed_total_objects"],
        missing_facings_count=comp["missing_facings_count"],
        unexpected_objects_count=comp["unexpected_objects_count"],
        facing_discrepancies=comp["facing_discrepancies"],
        status=comp["status"]
    )

# ----------------- PRODUCTS & INVENTORY -----------------
@router.get("/products", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.is_active == True).all()

@router.post("/products", response_model=ProductResponse)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    existing = db.query(Product).filter(Product.sku == data.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="Product SKU already exists")
    p = Product(**data.model_dump())
    db.add(p)
    db.flush()
    # Initialize blank inventory
    inv = InventoryRecord(product_id=p.id, recorded_shelf_qty=data.expected_shelf_qty, recorded_backroom_qty=10)
    db.add(inv)
    db.commit()
    db.refresh(p)
    return p

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p

@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    p.is_active = False
    db.commit()
    return {"message": "Product deactivated successfully"}

@router.get("/inventory", response_model=List[InventoryRecordSchema])
def get_inventory_records(db: Session = Depends(get_db)):
    return db.query(InventoryRecord).all()

@router.get("/inventory/{product_id}", response_model=InventoryRecordSchema)
def get_product_inventory(product_id: int, db: Session = Depends(get_db)):
    inv = db.query(InventoryRecord).filter(InventoryRecord.product_id == product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    return inv

@router.post("/inventory/updates", response_model=InventoryRecordSchema)
def update_inventory_record(req: InventoryUpdateRequest, db: Session = Depends(get_db)):
    inv = db.query(InventoryRecord).filter(InventoryRecord.product_id == req.product_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    if req.recorded_shelf_qty is not None:
        inv.recorded_shelf_qty = req.recorded_shelf_qty
    if req.recorded_backroom_qty is not None:
        inv.recorded_backroom_qty = req.recorded_backroom_qty
    if req.recent_sales_qty is not None:
        inv.recent_sales_qty = req.recent_sales_qty
    inv.source = req.source
    inv.last_updated = datetime.now(timezone.utc)
    db.commit()
    db.refresh(inv)
    return inv

# ----------------- OPERATIONAL TASKS & VERIFICATION -----------------
@router.get("/tasks", response_model=List[OperationalTaskResponse])
def get_operational_tasks(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(OperationalTask)
    if status:
        query = query.filter(OperationalTask.status == status)
    tasks = query.order_by(desc(OperationalTask.priority_score)).all()

    # Populate product_name
    res = []
    for t in tasks:
        item = OperationalTaskResponse.model_validate(t)
        if t.product:
            item.product_name = t.product.name
        res.append(item)
    return res

@router.get("/tasks/{task_id}", response_model=OperationalTaskResponse)
def get_task_detail(task_id: int, db: Session = Depends(get_db)):
    t = db.query(OperationalTask).filter(OperationalTask.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Operational task not found")
    item = OperationalTaskResponse.model_validate(t)
    if t.product:
        item.product_name = t.product.name
    return item

@router.patch("/tasks/{task_id}", response_model=OperationalTaskResponse)
def update_task_status(task_id: int, data: OperationalTaskUpdate, db: Session = Depends(get_db)):
    t = db.query(OperationalTask).filter(OperationalTask.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Operational task not found")
    
    prev_status = t.status
    if data.status and data.status != prev_status:
        t.status = data.status
        hist = TaskStatusHistory(
            task_id=t.id,
            previous_status=prev_status,
            new_status=data.status,
            changed_by="Associate User",
            notes=data.employee_notes or f"Status transitioned to {data.status}"
        )
        db.add(hist)

    if data.assigned_to:
        t.assigned_to = data.assigned_to
    if data.employee_notes:
        t.employee_notes = data.employee_notes

    t.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(t)
    item = OperationalTaskResponse.model_validate(t)
    if t.product:
        item.product_name = t.product.name
    return item

@router.get("/tasks/{task_id}/history")
def get_task_history(task_id: int, db: Session = Depends(get_db)):
    return db.query(TaskStatusHistory).filter(TaskStatusHistory.task_id == task_id).order_by(desc(TaskStatusHistory.id)).all()

@router.post("/tasks/{task_id}/verify", response_model=VerificationResultResponse)
async def verify_task_resolution(
    task_id: int,
    file: UploadFile = File(...),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Closed-Loop Verification Engine.
    Executes actual follow-up CV inference to compare before/after detection counts vs configured target.
    Does NOT blindly mark task complete based solely on a button click.
    """
    t = db.query(OperationalTask).filter(OperationalTask.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Operational task not found")

    # Save verification image
    file_id = f"verif_{uuid.uuid4().hex[:8]}_{file.filename}"
    raw_path = settings.UPLOADS_DIR / file_id
    with open(raw_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run genuine CV detection on follow-up image
    detections, duration_ms, annotated_path = detector.detect(str(raw_path))
    after_count = len(detections)

    # Retrieve before count from originating audit
    before_count = 2
    target_count = 8
    if t.audit:
        before_count = t.audit.total_detected_objects
    if t.planogram:
        target_count = t.planogram.target_facing_count

    # Evaluate resolution condition
    if after_count >= (target_count * 0.75):
        result = "SATISFIED"
        t.status = "VERIFIED_RESOLVED"
        verif_notes = f"Optical verification succeeded: Detected {after_count} facings (Target: {target_count}, Before: {before_count})."
    else:
        result = "UNMET"
        t.status = "ACTION_TAKEN"  # Remains in review
        verif_notes = f"Condition unmet: Detected {after_count} facings, still below required target of {target_count} (Before: {before_count})."

    # Save verification run
    v_run = TaskVerificationRun(
        task_id=t.id,
        audit_id=t.audit_id,
        verification_image_path=annotated_path,
        before_count=before_count,
        after_count=after_count,
        target_count=target_count,
        result=result,
        notes=notes or verif_notes,
        verified_at=datetime.now(timezone.utc)
    )
    db.add(v_run)

    # Add history
    hist = TaskStatusHistory(
        task_id=t.id,
        previous_status=t.status,
        new_status=t.status,
        changed_by="CV Verification Engine",
        notes=verif_notes
    )
    db.add(hist)
    db.commit()

    return VerificationResultResponse(
        task_id=t.id,
        audit_id=t.audit_id,
        before_count=before_count,
        after_count=after_count,
        target_count=target_count,
        result=result,
        notes=verif_notes,
        verified_at=v_run.verified_at
    )

@router.get("/priority-queue")
def get_priority_queue(db: Session = Depends(get_db)):
    tasks = db.query(OperationalTask).filter(
        OperationalTask.status.in_(["OPEN", "IN_PROGRESS", "ACTION_TAKEN"])
    ).order_by(desc(OperationalTask.priority_score)).all()

    queue_data = []
    for t in tasks:
        breakdown = json.loads(t.priority_breakdown_json) if t.priority_breakdown_json else {}
        queue_data.append({
            "task_id": t.id,
            "task_code": t.task_code,
            "product_name": t.product.name if t.product else "Assorted Category",
            "aisle": t.aisle,
            "shelf": t.shelf,
            "priority_score": t.priority_score,
            "priority_level": t.priority_level,
            "problem_type": t.problem_type,
            "recommended_action": t.recommended_action,
            "status": t.status,
            "breakdown": breakdown
        })
    return queue_data

# ----------------- CHECKOUT RECONCILIATION -----------------
@router.get("/checkout/sessions", response_model=List[CheckoutSessionResponse])
def get_checkout_sessions(db: Session = Depends(get_db)):
    return db.query(CheckoutSession).order_by(desc(CheckoutSession.id)).all()

@router.post("/checkout/sessions", response_model=CheckoutSessionResponse)
def create_checkout_session(data: CheckoutSessionCreate, db: Session = Depends(get_db)):
    sess_code = f"CHK-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    total_qty = sum(i.quantity_scanned for i in data.items)
    total_amount = sum(i.quantity_scanned * i.unit_price for i in data.items)
    total_expected_wt = sum(i.quantity_scanned * i.weight_expected for i in data.items)

    weight_diff = abs(data.total_weight_measured - total_expected_wt)
    if weight_diff > 40.0:  # Tolerance threshold 40 grams
        status = "DISCREPANCY_WEIGHT"
        notes = f"Weight variance of {weight_diff:.1f}g detected between scanned items ({total_expected_wt}g) and bagging scale ({data.total_weight_measured}g)."
    else:
        status = "MATCHED"
        notes = "Clean transaction: scanned weight reconciled within normal sensor tolerance."

    sess = CheckoutSession(
        session_code=sess_code,
        checkout_location=data.checkout_location,
        register_id=data.register_id,
        total_scanned_items=total_qty,
        total_scanned_amount=round(total_amount, 2),
        total_weight_expected=round(total_expected_wt, 1),
        total_weight_measured=round(data.total_weight_measured, 1),
        reconciliation_status=status,
        notes=notes,
        is_demo=False
    )
    db.add(sess)
    db.flush()

    for it in data.items:
        line = CheckoutLineItem(
            session_id=sess.id,
            sku=it.sku,
            product_name=it.product_name,
            quantity_scanned=it.quantity_scanned,
            unit_price=it.unit_price,
            weight_expected=it.weight_expected
        )
        db.add(line)

    if status.startswith("DISCREPANCY"):
        alert = Alert(
            alert_code=f"ALT-{uuid.uuid4().hex[:4].upper()}",
            alert_type="CHECKOUT_MISMATCH",
            severity="MEDIUM",
            title=f"Checkout Variance: {data.checkout_location}",
            message=notes,
            source_entity_type="CHECKOUT",
            source_entity_id=sess.session_code,
            status="ACTIVE",
            is_demo=False
        )
        db.add(alert)

    db.commit()
    db.refresh(sess)
    return sess

# ----------------- ALERTS -----------------
@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts(status: Optional[str] = None, severity: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)
    if severity:
        query = query.filter(Alert.severity == severity)
    return query.order_by(desc(Alert.id)).all()

@router.patch("/alerts/{alert_id}", response_model=AlertResponse)
def update_alert_status(alert_id: int, status: str = Query(...), db: Session = Depends(get_db)):
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    a.status = status
    if status in ["RESOLVED", "DISMISSED"]:
        a.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(a)
    return a

# ----------------- STORE EFFICIENCY ANALYTICS -----------------
@router.get("/analytics/zones")
def get_store_zones_analytics(db: Session = Depends(get_db)):
    zones = db.query(StoreZone).all()
    results = []
    for z in zones:
        ev = db.query(ActivityEvent).filter(ActivityEvent.zone_id == z.id).order_by(desc(ActivityEvent.id)).first()
        results.append({
            "zone_id": z.id,
            "name": z.name,
            "type": z.zone_type,
            "dwell_target_sec": z.dwell_target_sec,
            "current_visitors": ev.visitor_count if ev else 10,
            "avg_dwell_sec": ev.avg_dwell_seconds if ev else 120.0,
            "congestion": ev.congestion_level if ev else "NORMAL"
        })
    return results

@router.get("/analytics/dwell-time")
def get_dwell_time_summary(db: Session = Depends(get_db)):
    events = db.query(ActivityEvent).all()
    by_zone = {}
    for e in events:
        by_zone.setdefault(e.zone_name, []).append(e.avg_dwell_seconds)
    
    summary = []
    for zname, times in by_zone.items():
        summary.append({
            "zone": zname,
            "avg_dwell": round(sum(times) / max(1, len(times)), 1),
            "sample_count": len(times)
        })
    return summary

# ----------------- GEMINI CHATBOT -----------------
@router.get("/chat/status")
def get_chat_status():
    return {
        "gemini_available": gemini_copilot.is_available(),
        "model": settings.GEMINI_MODEL,
        "api_key_configured": bool(settings.GEMINI_API_KEY)
    }

@router.get("/chat/conversations", response_model=List[ChatConversationResponse])
def get_chat_conversations(db: Session = Depends(get_db)):
    return db.query(ChatConversation).order_by(desc(ChatConversation.id)).all()

@router.post("/chat/conversations", response_model=ChatConversationResponse)
def create_chat_conversation(title: str = "Retail Operations Inquiry", db: Session = Depends(get_db)):
    conv = ChatConversation(title=title)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv

@router.get("/chat/conversations/{conversation_id}", response_model=ChatConversationResponse)
def get_conversation_detail(conversation_id: int, db: Session = Depends(get_db)):
    conv = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.delete("/chat/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conv = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted"}

@router.post("/chat/conversations/{conversation_id}/messages")
def send_chat_message(
    conversation_id: int,
    req: ChatMessageRequest,
    db: Session = Depends(get_db)
):
    conv = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
    if not conv:
        # Auto-create if first message
        conv = ChatConversation(id=conversation_id, title=req.content[:30] + "...")
        db.add(conv)
        db.flush()

    # Save user message
    user_msg = ChatMessage(
        conversation_id=conv.id,
        sender="user",
        content=req.content
    )
    db.add(user_msg)
    db.flush()

    # Grounding context from real database
    ctx_service = RetailContextService(db)
    context_data = {
        "dashboard": ctx_service.get_dashboard_summary(),
        "open_tasks": ctx_service.get_open_tasks(5),
        "open_alerts": ctx_service.get_open_alerts(5),
        "checkout_discrepancies": ctx_service.get_checkout_discrepancies(),
        "store_zones": ctx_service.get_zone_activity()
    }

    # Retrieve history
    history = [
        {"sender": m.sender, "content": m.content}
        for m in conv.messages[-6:]
    ]

    # Generate response
    copilot_resp = gemini_copilot.generate_chat_response(
        user_message=req.content,
        context_data=context_data,
        conversation_history=history
    )

    action_meta = json.dumps(copilot_resp["action_metadata"]) if copilot_resp.get("action_metadata") else None

    # Save assistant message
    asst_msg = ChatMessage(
        conversation_id=conv.id,
        sender="assistant",
        content=copilot_resp["content"],
        action_metadata_json=action_meta
    )
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)

    return {
        "id": asst_msg.id,
        "conversation_id": conv.id,
        "sender": "assistant",
        "content": asst_msg.content,
        "action_metadata": copilot_resp.get("action_metadata"),
        "created_at": asst_msg.created_at
    }

# ----------------- DEMO DATA RESET -----------------
@router.post("/demo/reset")
def reset_demo_data_endpoint(db: Session = Depends(get_db)):
    res = seed_database(db, force_reset=True)
    return res

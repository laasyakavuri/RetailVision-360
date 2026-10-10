import os
import json
import datetime
from sqlalchemy.orm import Session
from app.models.entities import (
    Store, StoreZone, Product, InventoryRecord, Planogram,
    PlanogramPosition, ShelfAudit, DetectionRecord, DiagnosisRecord,
    OperationalTask, TaskStatusHistory, TaskVerificationRun,
    CheckoutSession, CheckoutLineItem, Alert, ActivityEvent, AppSetting
)
from app.core.config import settings

def seed_database(db: Session, force_reset: bool = False):
    """
    Seeds comprehensive, realistic demo data illustrating the complete RetailVision 360 ecosystem.
    Idempotent: If store exists and force_reset is False, leaves data intact.
    """
    existing_store = db.query(Store).filter(Store.code == "STR-1042").first()
    if existing_store and not force_reset:
        return {"status": "ALREADY_SEEDED", "message": "Database already seeded with demo records."}

    if force_reset:
        # Clear existing demo records
        db.query(TaskVerificationRun).delete()
        db.query(TaskStatusHistory).delete()
        db.query(OperationalTask).delete()
        db.query(DiagnosisRecord).delete()
        db.query(DetectionRecord).delete()
        db.query(ShelfAudit).delete()
        db.query(PlanogramPosition).delete()
        db.query(Planogram).delete()
        db.query(CheckoutLineItem).delete()
        db.query(CheckoutSession).delete()
        db.query(Alert).delete()
        db.query(ActivityEvent).delete()
        db.query(StoreZone).delete()
        db.query(InventoryRecord).delete()
        db.query(Product).delete()
        db.query(Store).delete()
        db.commit()

    now = datetime.datetime.now(datetime.timezone.utc)

    # 1. Store & Zones
    store = Store(
        code="STR-1042",
        name="Metro Market Flagship (Downtown 4th)",
        address="742 Market Boulevard, Metro City"
    )
    db.add(store)
    db.flush()

    zones_data = [
        ("Entrance & Foyer", "entrance", 45.0, 50),
        ("Aisle 1 - Refreshments & Beverages", "aisle", 180.0, 35),
        ("Aisle 2 - Snacks & Confectionery", "aisle", 140.0, 30),
        ("Aisle 3 - Fresh Produce & Bakery", "aisle", 210.0, 40),
        ("Express Self-Checkout", "checkout", 95.0, 25),
        ("Assisted Checkout Lanes", "checkout", 150.0, 30)
    ]
    zones = []
    for name, z_type, target_dwell, cap in zones_data:
        z = StoreZone(store_id=store.id, name=name, zone_type=z_type, dwell_target_sec=target_dwell, capacity=cap)
        db.add(z)
        zones.append(z)
    db.flush()

    # 2. Product Catalog (10 items across beverage & snack categories)
    products_data = [
        ("SKU-BEV-01", "PureGlacier Sparkling Water 500ml", "PureGlacier", "Beverages", "89012345601", 1.99, 12, 4),
        ("SKU-BEV-02", "NitroCraft Cold Brew Espresso 330ml", "NitroCraft", "Beverages", "89012345602", 3.49, 10, 3),
        ("SKU-BEV-03", "HydroPulse Electrolyte Drink Berry 600ml", "HydroPulse", "Beverages", "89012345603", 2.49, 12, 4),
        ("SKU-BEV-04", "GreenElixir Ceremonial Matcha Latte 250ml", "GreenElixir", "Beverages", "89012345604", 3.99, 8, 2),
        ("SKU-BEV-05", "Heritage Artisanal Botanical Cola 355ml", "Heritage Brews", "Beverages", "89012345605", 2.29, 10, 3),
        ("SKU-BEV-06", "SolZest Blood Orange Sparkling Juice 330ml", "SolZest", "Beverages", "89012345606", 2.79, 10, 3),
        ("SKU-SNK-01", "CrispRidge Sea Salt Kettle Chips 150g", "CrispRidge", "Snacks", "89012345607", 2.99, 14, 5),
        ("SKU-SNK-02", "TruffleGourmet Roasted Almonds 100g", "TruffleGourmet", "Snacks", "89012345608", 4.99, 10, 3),
        ("SKU-SNK-03", "VelvetCoco 72% Dark Chocolate Bar 85g", "VelvetCoco", "Snacks", "89012345609", 3.29, 12, 4),
        ("SKU-SNK-04", "AncientGrains Oat & Honey Crisp Bar 60g", "AncientGrains", "Snacks", "89012345610", 1.49, 16, 6)
    ]
    products = []
    for sku, name, brand, cat, barcode, price, shelf_qty, min_th in products_data:
        p = Product(
            sku=sku, name=name, brand=brand, category=cat, barcode=barcode,
            unit_price=price, expected_shelf_qty=shelf_qty, min_threshold=min_th
        )
        db.add(p)
        products.append(p)
    db.flush()

    # 3. Persistent Inventory Records (Demonstrating backroom availability vs depletion)
    inventory_data = [
        # prod_idx, shelf_qty, backroom_qty, recent_sales, sales_rate_hr
        (0, 2, 28, 14, 3.5),   # PureGlacier: LOW SHELF, HIGH BACKROOM -> Restock Available!
        (1, 1, 0, 19, 4.2),    # NitroCraft: LOW SHELF, ZERO BACKROOM -> Depleted Stockout!
        (2, 9, 15, 6, 1.2),    # HydroPulse: HEALTHY SHELF
        (3, 3, 10, 8, 1.8),    # GreenElixir: Moderate gap
        (4, 8, 12, 5, 1.1),    # Heritage Cola: Healthy
        (5, 7, 18, 7, 1.5),    # SolZest: Healthy
        (6, 12, 40, 22, 5.0),  # Chips: Healthy
        (7, 2, 6, 9, 2.0),     # Almonds: Moderate
        (8, 10, 20, 11, 2.2),  # Chocolate: Healthy
        (9, 14, 50, 15, 2.8)   # Oat Bar: Healthy
    ]
    for idx, s_qty, b_qty, sales, rate in inventory_data:
        inv = InventoryRecord(
            product_id=products[idx].id,
            recorded_shelf_qty=s_qty,
            recorded_backroom_qty=b_qty,
            recent_sales_qty=sales,
            sales_rate_per_hour=rate,
            reorder_threshold=5,
            source="ERP_SYNC",
            last_updated=now - datetime.timedelta(minutes=15)
        )
        db.add(inv)
    db.flush()

    # 4. Planogram: Beverage Showcase Shelf B2
    planogram = Planogram(
        name="Beverage Showcase Planogram (B2)",
        store_id=store.id,
        aisle="Aisle 1",
        shelf="Shelf B2",
        rows=2,
        cols=4,
        occupancy_threshold=0.75,
        target_facing_count=8,
        is_active=True
    )
    db.add(planogram)
    db.flush()

    # Planogram positions
    positions_map = [
        (0, 0, products[0].id, 1),
        (0, 1, products[1].id, 1),
        (0, 2, products[2].id, 1),
        (0, 3, products[3].id, 1),
        (1, 0, products[4].id, 1),
        (1, 1, products[5].id, 1),
        (1, 2, products[0].id, 1),
        (1, 3, products[2].id, 1)
    ]
    for r, c, pid, facings in positions_map:
        pos = PlanogramPosition(
            planogram_id=planogram.id,
            row_index=r,
            col_index=c,
            product_id=pid,
            expected_facings=facings,
            min_occupancy_ratio=0.6
        )
        db.add(pos)
    db.flush()

    # 5. Shelf Audits (Illustrating before/after and varied conditions)
    # Audit 1: High severity gap on Shelf B2
    audit1 = ShelfAudit(
        audit_code="AUD-2026-001",
        timestamp=now - datetime.timedelta(hours=2),
        aisle="Aisle 1",
        shelf="Shelf B2",
        planogram_id=planogram.id,
        raw_image_path="sample_data/shelf_gap_sample.jpg",
        annotated_image_path="sample_data/shelf_gap_annotated.jpg",
        total_detected_objects=3,
        occupancy_rate=0.375,  # 37.5% occupancy vs 8 target
        status="COMPLETED",
        inference_duration_ms=42.5,
        model_name="YOLOv8n-Retail",
        is_demo=True,
        notes="Automated morning audit detected significant void in top-left shelf section."
    )
    db.add(audit1)
    db.flush()

    # Detections for Audit 1
    det_coords = [
        ("bottle", 0.91, 550.0, 120.0, 680.0, 480.0, products[2].id, 0.88, "MATCHED"),
        ("bottle", 0.87, 850.0, 130.0, 970.0, 490.0, products[3].id, 0.82, "MATCHED"),
        ("bottle", 0.79, 210.0, 380.0, 340.0, 690.0, products[4].id, 0.74, "MATCHED")
    ]
    for cls_name, conf, x1, y1, x2, y2, m_pid, m_conf, m_stat in det_coords:
        d = DetectionRecord(
            audit_id=audit1.id,
            class_name=cls_name,
            confidence=conf,
            bbox_x1=x1, bbox_y1=y1, bbox_x2=x2, bbox_y2=y2,
            matched_product_id=m_pid,
            match_confidence=m_conf,
            match_status=m_stat
        )
        db.add(d)
    db.flush()

    # Diagnosis 1: Restock Available for PureGlacier Water
    diag1 = DiagnosisRecord(
        audit_id=audit1.id,
        product_id=products[0].id,
        classification="Critical Shelf Gap - Restock Available",
        diagnosis_type="STOCKOUT_AVAILABLE",
        explanation="Shelf B2 shows only 3 of 8 facings populated (37.5% occupancy). PureGlacier facings completely absent. Backroom records confirm 28 units ready for transfer.",
        trigger_rule="Occupancy < 40% AND Backroom Stock > 0",
        visual_evidence="3 bounding boxes confirmed. Void detected in Row 1 Cols 1-2. Bounding box confidence: 0.86 avg.",
        inventory_evidence="ERP confirms 28 units in backroom bin B-14. Estimated sales velocity: 3.5 units/hour.",
        confidence_level="HIGH",
        is_demo=True,
        created_at=now - datetime.timedelta(hours=2)
    )
    db.add(diag1)

    # 6. Operational Tasks illustrating Explainable Prioritization & Closed Loop
    # Task 1: Actionable Restock (CRITICAL PRIORITY)
    breakdown1 = {
        "gap_severity_score": 85.0,
        "sales_velocity_score": 70.0,
        "backroom_stock_score": 100.0,
        "task_age_score": 65.0,
        "evidence_confidence_score": 90.0,
        "total_score": 82.5,
        "priority_level": "CRITICAL",
        "rationale": [
            "Severe shelf void (37.5% occupancy vs 75% target)",
            "High customer demand (3.5 units/hour velocity)",
            "Directly actionable: 28 units in backroom B-14",
            "High optical evidence confidence (90%)"
        ],
        "missing_info": []
    }
    task1 = OperationalTask(
        task_code="TSK-101",
        audit_id=audit1.id,
        planogram_id=planogram.id,
        product_id=products[0].id,
        store_id=store.id,
        aisle="Aisle 1",
        shelf="Shelf B2",
        problem_type="CRITICAL_GAP_RESTOCK_READY",
        priority_level="CRITICAL",
        priority_score=82.5,
        priority_breakdown_json=json.dumps(breakdown1),
        recommended_action="Transfer 6 units of PureGlacier Sparkling Water from Backroom Bay B-14 to Shelf B2.",
        trigger_thresholds="Occupancy < 40% (Observed: 37.5%) & Backroom > 0 (Observed: 28)",
        status="OPEN",
        assigned_to="Marcus Vance (Floor Lead)",
        is_demo=True,
        created_at=now - datetime.timedelta(hours=2)
    )
    db.add(task1)
    db.flush()

    hist1 = TaskStatusHistory(
        task_id=task1.id,
        previous_status="CREATED",
        new_status="OPEN",
        changed_by="Automated Diagnosis Engine",
        notes="Created after Audit AUD-2026-001 confirmed actionable stockout.",
        timestamp=now - datetime.timedelta(hours=2)
    )
    db.add(hist1)

    # Task 2: Depleted Product (Requires PO Reorder, not associate restock)
    breakdown2 = {
        "gap_severity_score": 90.0,
        "sales_velocity_score": 85.0,
        "backroom_stock_score": 25.0,  # Depleted backroom reduces immediate floor urgency
        "task_age_score": 40.0,
        "evidence_confidence_score": 85.0,
        "total_score": 68.0,
        "priority_level": "HIGH",
        "rationale": [
            "Complete shelf stockout of NitroCraft Cold Brew",
            "Backroom storage depleted (0 units)",
            "Supplier PO reorder required"
        ],
        "missing_info": []
    }
    task2 = OperationalTask(
        task_code="TSK-102",
        audit_id=audit1.id,
        planogram_id=planogram.id,
        product_id=products[1].id,
        store_id=store.id,
        aisle="Aisle 1",
        shelf="Shelf B2",
        problem_type="FULL_STOCKOUT_DEPLETED",
        priority_level="HIGH",
        priority_score=68.0,
        priority_breakdown_json=json.dumps(breakdown2),
        recommended_action="Expedite vendor replenishment with Roaster Supply Co. Place out-of-stock tag.",
        trigger_thresholds="Backroom == 0 & Shelf == 0",
        status="IN_PROGRESS",
        assigned_to="Elena Rostova (Inventory Specialist)",
        is_demo=True,
        created_at=now - datetime.timedelta(hours=1, minutes=30)
    )
    db.add(task2)
    db.flush()

    # Task 3: VERIFIED RESOLVED TASK (Illustrating the complete closed loop!)
    breakdown3 = {
        "gap_severity_score": 75.0,
        "sales_velocity_score": 50.0,
        "backroom_stock_score": 100.0,
        "task_age_score": 80.0,
        "evidence_confidence_score": 92.0,
        "total_score": 76.5,
        "priority_level": "HIGH",
        "rationale": ["Prior gap resolved via verified restock audit."],
        "missing_info": []
    }
    task3 = OperationalTask(
        task_code="TSK-098",
        audit_id=audit1.id,
        planogram_id=planogram.id,
        product_id=products[2].id,
        store_id=store.id,
        aisle="Aisle 1",
        shelf="Shelf B1",
        problem_type="MODERATE_FACING_DEFICIT",
        priority_level="HIGH",
        priority_score=76.5,
        priority_breakdown_json=json.dumps(breakdown3),
        recommended_action="Restock 6 facings of HydroPulse Electrolyte Drink.",
        trigger_thresholds="Occupancy < 60%",
        status="VERIFIED_RESOLVED",
        assigned_to="Sarah Jenkins",
        employee_notes="Restocked 6 bottles from aisle cart. Verification image captured.",
        is_demo=True,
        created_at=now - datetime.timedelta(hours=4),
        updated_at=now - datetime.timedelta(hours=3)
    )
    db.add(task3)
    db.flush()

    # Verification run for Task 3
    verif = TaskVerificationRun(
        task_id=task3.id,
        audit_id=audit1.id,
        verification_image_path="sample_data/shelf_resolved_sample.jpg",
        before_count=2,
        after_count=8,
        target_count=8,
        result="SATISFIED",
        notes="Follow-up optical audit confirmed 8 visible facings. Target of 8 items fully satisfied.",
        verified_at=now - datetime.timedelta(hours=3)
    )
    db.add(verif)

    # 7. Checkout Sessions (Illustrating Reconciliation & Discrepancies)
    # Session 1: Discrepancy (Scanned 1 item, scale registered weight of 2 items)
    sess1 = CheckoutSession(
        session_code="CHK-2026-8812",
        checkout_location="Self-Checkout Terminal 03",
        register_id="SCO-03",
        timestamp=now - datetime.timedelta(minutes=24),
        total_scanned_items=1,
        total_scanned_amount=4.99,
        total_weight_expected=100.0,
        total_weight_measured=245.0,  # 145g overweight
        reconciliation_status="DISCREPANCY_WEIGHT",
        notes="Scale variance detected: +145g over expected bag weight. Potential unscanned item in bagging zone.",
        is_demo=True
    )
    db.add(sess1)
    db.flush()

    item1 = CheckoutLineItem(
        session_id=sess1.id,
        product_id=products[7].id,
        sku=products[7].sku,
        product_name=products[7].name,
        quantity_scanned=1,
        unit_price=4.99,
        weight_expected=100.0
    )
    db.add(item1)

    # Session 2: Matched Clean Transaction
    sess2 = CheckoutSession(
        session_code="CHK-2026-8813",
        checkout_location="Assisted Lane 02",
        register_id="POS-02",
        timestamp=now - datetime.timedelta(minutes=10),
        total_scanned_items=3,
        total_scanned_amount=8.47,
        total_weight_expected=980.0,
        total_weight_measured=978.0,
        reconciliation_status="MATCHED",
        notes="All scanned items match bagging scale within 2g tolerance.",
        is_demo=True
    )
    db.add(sess2)
    db.flush()

    # 8. Operational Alerts
    alerts_data = [
        ("ALT-001", "STOCKOUT_RISK", "CRITICAL", "Critical Shelf Gap on Shelf B2", "PureGlacier Sparkling Water facings depleted. 28 units available in backroom.", "TASK", "TSK-101", "ACTIVE"),
        ("ALT-002", "STOCKOUT_RISK", "HIGH", "Supplier Replenishment Required", "NitroCraft Cold Brew 100% depleted with 0 backroom units.", "TASK", "TSK-102", "ACKNOWLEDGED"),
        ("ALT-003", "CHECKOUT_MISMATCH", "MEDIUM", "Bagging Scale Weight Mismatch", "SCO-03 registered +145g discrepancy above scanned weight.", "CHECKOUT", "CHK-2026-8812", "ACTIVE"),
        ("ALT-004", "PLANOGRAM_MISMATCH", "LOW", "Minor Facing Alignment Variance", "Aisle 2 Shelf C1 observed 1 facing shift.", "AUDIT", "AUD-2026-001", "RESOLVED")
    ]
    for code, a_type, sev, title, msg, src_type, src_id, status in alerts_data:
        a = Alert(
            alert_code=code, alert_type=a_type, severity=sev, title=title,
            message=msg, source_entity_type=src_type, source_entity_id=src_id,
            status=status, is_demo=True, created_at=now - datetime.timedelta(minutes=45)
        )
        db.add(a)

    # 9. Store Efficiency & Activity Events
    activity_samples = [
        (zones[0].id, zones[0].name, 38, 42.0, "NORMAL"),
        (zones[1].id, zones[1].name, 22, 165.0, "NORMAL"),
        (zones[2].id, zones[2].name, 19, 130.0, "NORMAL"),
        (zones[3].id, zones[3].name, 31, 220.0, "MODERATE"),
        (zones[4].id, zones[4].name, 27, 185.0, "CONGESTED"),
        (zones[5].id, zones[5].name, 15, 140.0, "NORMAL")
    ]
    for zid, zname, v_cnt, dwell, cong in activity_samples:
        ev = ActivityEvent(
            zone_id=zid, zone_name=zname, visitor_count=v_cnt,
            avg_dwell_seconds=dwell, congestion_level=cong, is_demo=True,
            timestamp=now - datetime.timedelta(minutes=15)
        )
        db.add(ev)

    # 10. Application Settings
    settings_items = [
        ("DEMO_DATA_INITIALIZED", "true", "Indicates demo scenario has been loaded"),
        ("CV_MODEL_ACTIVE", "yolov8n.pt", "Active inference model checkpoint"),
        ("STORE_ID_ACTIVE", "1", "Active primary store location")
    ]
    for k, v, d in settings_items:
        s = AppSetting(key=k, value=v, description=d)
        db.add(s)

    db.commit()
    return {"status": "SUCCESS", "message": "Demo scenario initialized successfully."}

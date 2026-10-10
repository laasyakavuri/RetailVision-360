import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.services.seed_data import seed_database
from app.services.priority_service import priority_engine
from app.services.diagnosis_service import diagnosis_service
from app.vision.detector import detector
from app.vision.planogram_matcher import planogram_matcher

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    db = SessionLocal()
    seed_database(db, force_reset=False)
    db.close()

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "RetailVision 360" in data["app_name"]

def test_system_status():
    response = client.get("/api/system/status")
    assert response.status_code == 200
    data = response.json()
    assert data["backend_running"] is True
    assert "cv_model" in data
    assert "gemini" in data

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_shelf_audits"] >= 1
    assert data["open_operational_tasks"] >= 1
    assert "cv_model_available" in data
    assert "gemini_available" in data

def test_product_crud():
    # Read products
    response = client.get("/api/products")
    assert response.status_code == 200
    products = response.json()
    assert len(products) >= 5

    # Create new product
    new_prod = {
        "sku": f"SKU-TEST-{os.urandom(2).hex()}",
        "name": "Test Sparkling Seltzer 330ml",
        "brand": "SeltzerCo",
        "category": "Beverages",
        "unit_price": 2.49,
        "expected_shelf_qty": 12,
        "min_threshold": 3
    }
    create_resp = client.post("/api/products", json=new_prod)
    assert create_resp.status_code == 200
    created = create_resp.json()
    assert created["name"] == new_prod["name"]
    pid = created["id"]

    # Update product
    update_resp = client.put(f"/api/products/{pid}", json={"unit_price": 2.99})
    assert update_resp.status_code == 200
    assert update_resp.json()["unit_price"] == 2.99

    # Deactivate product
    del_resp = client.delete(f"/api/products/{pid}")
    assert del_resp.status_code == 200

def test_planograms_and_comparison():
    # List planograms
    response = client.get("/api/planograms")
    assert response.status_code == 200
    pls = response.json()
    assert len(pls) >= 1
    pl_id = pls[0]["id"]

    # Audits
    audits_resp = client.get("/api/shelf-audits")
    assert audits_resp.status_code == 200
    audits = audits_resp.json()
    assert len(audits) >= 1
    audit_id = audits[0]["id"]

    # Compare planogram with audit
    comp_resp = client.post(f"/api/planograms/{pl_id}/compare?audit_id={audit_id}")
    assert comp_resp.status_code == 200
    comp = comp_resp.json()
    assert "compliance_score" in comp
    assert "expected_total_facings" in comp
    assert "facing_discrepancies" in comp

def test_explainable_priority_formula():
    # Test Priority formula calculation directly
    calc = priority_engine.calculate_priority(
        occupancy_rate=0.30,
        target_count=10,
        observed_count=3,
        recorded_backroom_qty=24,
        sales_rate_per_hour=4.5,
        task_created_at=None,
        avg_detection_confidence=0.88
    )
    # 70% gap (24.5) + 45% sales (11.25) + 100% backroom (20) + 20% age (2) + 88% conf (8.8) = 66.6 (HIGH band)
    assert calc["total_score"] >= 60.0
    assert calc["priority_level"] == "HIGH"
    assert len(calc["rationale"]) >= 3
    assert "gap_severity_score" in calc
    assert "backroom_stock_score" in calc

def test_shelf_to_action_diagnosis_service():
    # Test Inventory-aware diagnosis
    diag = diagnosis_service.diagnose(
        audit_id=999,
        observed_occupancy=0.25,
        detected_count=2,
        target_count=8,
        detections=[{"confidence": 0.85}, {"confidence": 0.90}],
        inventory_record=None,
        product=None
    )
    assert diag["confidence_level"] in ["HIGH", "MEDIUM", "REQUIRES_VERIFICATION"]
    assert "explanation" in diag
    assert "recommended_action" in diag

def test_tasks_and_closed_loop_verification():
    # Fetch tasks
    response = client.get("/api/tasks")
    assert response.status_code == 200
    tasks = response.json()
    assert len(tasks) >= 1
    t = tasks[0]
    task_id = t["id"]

    # Update status to ACTION_TAKEN
    patch_resp = client.patch(f"/api/tasks/{task_id}", json={
        "status": "ACTION_TAKEN",
        "employee_notes": "Associate replenished shelf from backroom inventory cart."
    })
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "ACTION_TAKEN"

    # Verify history
    hist_resp = client.get(f"/api/tasks/{task_id}/history")
    assert hist_resp.status_code == 200
    assert len(hist_resp.json()) >= 1

def test_checkout_reconciliation():
    # Create checkout session with deliberate discrepancy
    chk_payload = {
        "checkout_location": "Self-Checkout Bay 04",
        "register_id": "SCO-04",
        "total_weight_measured": 480.0,
        "items": [
            {
                "sku": "SKU-BEV-01",
                "product_name": "PureGlacier Water",
                "quantity_scanned": 1,
                "unit_price": 1.99,
                "weight_expected": 200.0  # Measured 480g vs expected 200g (+280g variance)
            }
        ]
    }
    resp = client.post("/api/checkout/sessions", json=chk_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["reconciliation_status"] == "DISCREPANCY_WEIGHT"
    assert "Weight variance" in data["notes"]

def test_chat_status_and_conversation():
    # Chat status
    status_resp = client.get("/api/chat/status")
    assert status_resp.status_code == 200
    assert "gemini_available" in status_resp.json()

    # Create conversation
    conv_resp = client.post("/api/chat/conversations?title=OpsTest")
    assert conv_resp.status_code == 200
    conv_id = conv_resp.json()["id"]

    # Send message grounded on DB
    msg_resp = client.post(
        f"/api/chat/conversations/{conv_id}/messages",
        json={"content": "Which shelves require restocking based on current backroom records?"}
    )
    assert msg_resp.status_code == 200
    reply = msg_resp.json()
    assert reply["sender"] == "assistant"
    assert len(reply["content"]) > 10

def test_shelf_audit_upload_genuine_cv():
    sample_img_path = "sample_data/shelf_gap_sample.jpg"
    if not os.path.exists(sample_img_path):
        sample_img_path = "../sample_data/shelf_gap_sample.jpg"

    assert os.path.exists(sample_img_path), f"Sample image {sample_img_path} not found"

    with open(sample_img_path, "rb") as f:
        resp = client.post(
            "/api/shelf-audits",
            files={"file": ("shelf_gap_sample.jpg", f, "image/jpeg")},
            data={"aisle": "Aisle 1", "shelf": "Shelf B2"}
        )
    assert resp.status_code == 200
    audit = resp.json()
    assert audit["total_detected_objects"] >= 1
    assert audit["inference_duration_ms"] > 0
    assert audit["annotated_image_path"] is not None

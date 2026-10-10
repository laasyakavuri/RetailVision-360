from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.entities import (
    Store, StoreZone, Product, InventoryRecord, Planogram,
    ShelfAudit, DetectionRecord, DiagnosisRecord, OperationalTask,
    TaskVerificationRun, CheckoutSession, Alert, ActivityEvent
)

class RetailContextService:
    """
    Controlled, read-only retail context retrieval for Gemini AI Copilot.
    Extracts bounded, relevant database evidence without sending raw unindexed dumps
    or permitting arbitrary model-generated SQL execution.
    """
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_summary(self) -> Dict[str, Any]:
        total_audits = self.db.query(ShelfAudit).count()
        total_detections = self.db.query(DetectionRecord).count()
        open_tasks = self.db.query(OperationalTask).filter(OperationalTask.status.in_(["OPEN", "IN_PROGRESS"])).count()
        critical_tasks = self.db.query(OperationalTask).filter(
            OperationalTask.priority_level == "CRITICAL",
            OperationalTask.status.in_(["OPEN", "IN_PROGRESS"])
        ).count()
        active_alerts = self.db.query(Alert).filter(Alert.status == "ACTIVE").count()
        checkout_discrepancies = self.db.query(CheckoutSession).filter(
            CheckoutSession.reconciliation_status.like("DISCREPANCY%")
        ).count()
        verifications_completed = self.db.query(TaskVerificationRun).count()

        return {
            "source": "DATABASE_LIVE_RECORDS",
            "total_shelf_audits": total_audits,
            "total_detected_objects": total_detections,
            "open_operational_tasks": open_tasks,
            "critical_priority_tasks": critical_tasks,
            "active_alerts": active_alerts,
            "unresolved_checkout_discrepancies": checkout_discrepancies,
            "completed_verifications": verifications_completed
        }

    def get_open_tasks(self, limit: int = 5) -> List[Dict[str, Any]]:
        tasks = self.db.query(OperationalTask).filter(
            OperationalTask.status.in_(["OPEN", "IN_PROGRESS", "ACTION_TAKEN"])
        ).order_by(OperationalTask.priority_score.desc()).limit(limit).all()

        results = []
        for t in tasks:
            results.append({
                "task_code": t.task_code,
                "problem_type": t.problem_type,
                "aisle": t.aisle,
                "shelf": t.shelf,
                "priority_level": t.priority_level,
                "priority_score": t.priority_score,
                "recommended_action": t.recommended_action,
                "status": t.status,
                "trigger_thresholds": t.trigger_thresholds,
                "is_demo": t.is_demo
            })
        return results

    def get_task_priority_breakdown(self, task_code_or_id: str) -> Optional[Dict[str, Any]]:
        query = self.db.query(OperationalTask)
        if task_code_or_id.isdigit():
            task = query.filter(OperationalTask.id == int(task_code_or_id)).first()
        else:
            task = query.filter(OperationalTask.task_code == task_code_or_id).first()

        if not task:
            return None

        return {
            "task_code": task.task_code,
            "problem": task.problem_type,
            "priority_score": task.priority_score,
            "priority_level": task.priority_level,
            "breakdown": task.priority_breakdown_json,
            "recommended_action": task.recommended_action,
            "status": task.status
        }

    def get_open_alerts(self, limit: int = 5) -> List[Dict[str, Any]]:
        alerts = self.db.query(Alert).filter(Alert.status == "ACTIVE").order_by(Alert.id.desc()).limit(limit).all()
        return [
            {
                "alert_code": a.alert_code,
                "severity": a.severity,
                "type": a.alert_type,
                "title": a.title,
                "message": a.message,
                "is_demo": a.is_demo
            }
            for a in alerts
        ]

    def get_shelf_audit_details(self, audit_code: str) -> Optional[Dict[str, Any]]:
        audit = self.db.query(ShelfAudit).filter(ShelfAudit.audit_code == audit_code).first()
        if not audit:
            return None
        return {
            "audit_code": audit.audit_code,
            "aisle": audit.aisle,
            "shelf": audit.shelf,
            "occupancy_rate": f"{audit.occupancy_rate*100:.1f}%",
            "detected_objects": audit.total_detected_objects,
            "inference_duration_ms": audit.inference_duration_ms,
            "model_name": audit.model_name,
            "timestamp": str(audit.timestamp),
            "is_demo": audit.is_demo
        }

    def get_checkout_discrepancies(self) -> List[Dict[str, Any]]:
        sessions = self.db.query(CheckoutSession).filter(
            CheckoutSession.reconciliation_status != "MATCHED"
        ).limit(5).all()
        return [
            {
                "session_code": s.session_code,
                "location": s.checkout_location,
                "register_id": s.register_id,
                "scanned_items": s.total_scanned_items,
                "amount": s.total_scanned_amount,
                "weight_expected_vs_measured": f"{s.total_weight_expected}g vs {s.total_weight_measured}g",
                "status": s.reconciliation_status,
                "notes": s.notes
            }
            for s in sessions
        ]

    def get_zone_activity(self) -> List[Dict[str, Any]]:
        zones = self.db.query(StoreZone).all()
        out = []
        for z in zones:
            latest_ev = self.db.query(ActivityEvent).filter(ActivityEvent.zone_id == z.id).order_by(ActivityEvent.id.desc()).first()
            out.append({
                "zone_name": z.name,
                "zone_type": z.zone_type,
                "visitor_count": latest_ev.visitor_count if latest_ev else 0,
                "avg_dwell_sec": latest_ev.avg_dwell_seconds if latest_ev else 0.0,
                "congestion": latest_ev.congestion_level if latest_ev else "NORMAL"
            })
        return out

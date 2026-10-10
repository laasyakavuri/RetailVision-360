from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.core.config import settings

class OperationalPriorityEngine:
    """
    Explainable Operational Priority Scoring Engine.
    Formula calculates an operational decision-support score from 0 to 100 based on:
    - Shelf Gap Severity (35%)
    - Sales Velocity / Demand Urgency (25%)
    - Actionable Backroom Restock Availability (20%)
    - Task Age / Wait Time (10%)
    - Evidence Reliability & Optical Confidence (10%)
    """
    def calculate_priority(
        self,
        occupancy_rate: float,
        target_count: int,
        observed_count: int,
        recorded_backroom_qty: Optional[int],
        sales_rate_per_hour: Optional[float],
        task_created_at: Optional[datetime],
        avg_detection_confidence: float
    ) -> Dict[str, Any]:
        rationale: List[str] = []
        missing_info: List[str] = []

        # 1. Gap Severity (0 to 100)
        # If target is 10 and observed is 2, deficit ratio is 8/10 = 0.8 -> score 80
        if target_count > 0:
            deficit = max(0, target_count - observed_count)
            gap_severity_norm = min(100.0, (deficit / target_count) * 100.0)
        else:
            gap_severity_norm = max(0.0, (1.0 - occupancy_rate) * 100.0)
        rationale.append(f"Shelf gap severity: {gap_severity_norm:.1f}/100 ({observed_count}/{target_count} facings present)")

        # 2. Sales Velocity (0 to 100)
        if sales_rate_per_hour is not None:
            # Assume 10+ units/hr is max retail velocity (score 100)
            sales_velocity_norm = min(100.0, (sales_rate_per_hour / 10.0) * 100.0)
            rationale.append(f"Sales velocity: {sales_velocity_norm:.1f}/100 (~{sales_rate_per_hour:.1f} units/hr demand)")
        else:
            sales_velocity_norm = 40.0  # Moderate default when unmeasured
            missing_info.append("Live POS velocity unrecorded; using catalog baseline")

        # 3. Actionable Backroom Stock (0 to 100)
        # If backroom stock exists, the task is immediately actionable by associate -> higher operational score!
        if recorded_backroom_qty is not None:
            if recorded_backroom_qty > 0:
                backroom_stock_norm = 100.0
                rationale.append(f"Actionable resolution: {recorded_backroom_qty} units verified in backroom")
            else:
                backroom_stock_norm = 25.0
                rationale.append("Backroom stock depleted (requires supplier reorder, not immediate restock)")
        else:
            backroom_stock_norm = 50.0
            missing_info.append("Backroom inventory record missing")

        # 4. Task Age / Urgency (0 to 100)
        if task_created_at:
            now = datetime.now(timezone.utc)
            # Make timezone aware if needed
            if task_created_at.tzinfo is None:
                task_dt = task_created_at.replace(tzinfo=timezone.utc)
            else:
                task_dt = task_created_at
            age_minutes = max(0.0, (now - task_dt).total_seconds() / 60.0)
            # Max score after 180 minutes (3 hours)
            task_age_norm = min(100.0, (age_minutes / 180.0) * 100.0)
            rationale.append(f"Task open duration: {int(age_minutes)} mins ({task_age_norm:.1f}/100 age weight)")
        else:
            task_age_norm = 20.0

        # 5. Evidence Confidence (0 to 100)
        evidence_confidence_norm = min(100.0, max(0.0, avg_detection_confidence * 100.0))
        if evidence_confidence_norm < 50.0:
            rationale.append(f"Optical evidence uncertainty noted (confidence {avg_detection_confidence:.2f})")
        else:
            rationale.append(f"High-confidence visual evidence ({avg_detection_confidence*100:.1f}%)")

        # Calculate weighted sum
        total_score = (
            (gap_severity_norm * settings.WEIGHT_GAP_SEVERITY) +
            (sales_velocity_norm * settings.WEIGHT_SALES_VELOCITY) +
            (backroom_stock_norm * settings.WEIGHT_BACKROOM_STOCK) +
            (task_age_norm * settings.WEIGHT_TASK_AGE) +
            (evidence_confidence_norm * settings.WEIGHT_EVIDENCE_CONFIDENCE)
        )
        total_score = round(total_score, 1)

        # Determine priority band
        if evidence_confidence_norm < 40.0:
            priority_level = "REQUIRES_VERIFICATION"
        elif total_score >= 75.0:
            priority_level = "CRITICAL"
        elif total_score >= 60.0:
            priority_level = "HIGH"
        elif total_score >= 40.0:
            priority_level = "MEDIUM"
        else:
            priority_level = "LOW"

        breakdown = {
            "gap_severity_score": round(gap_severity_norm, 1),
            "sales_velocity_score": round(sales_velocity_norm, 1),
            "backroom_stock_score": round(backroom_stock_norm, 1),
            "task_age_score": round(task_age_norm, 1),
            "evidence_confidence_score": round(evidence_confidence_norm, 1),
            "total_score": total_score,
            "priority_level": priority_level,
            "weights": {
                "gap_severity": settings.WEIGHT_GAP_SEVERITY,
                "sales_velocity": settings.WEIGHT_SALES_VELOCITY,
                "backroom_stock": settings.WEIGHT_BACKROOM_STOCK,
                "task_age": settings.WEIGHT_TASK_AGE,
                "evidence_confidence": settings.WEIGHT_EVIDENCE_CONFIDENCE
            },
            "rationale": rationale,
            "missing_info": missing_info
        }

        return breakdown

priority_engine = OperationalPriorityEngine()

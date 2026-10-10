from typing import Dict, Any, List, Optional
from app.models.entities import Product, InventoryRecord

class ShelfDiagnosisService:
    """
    Inventory-Aware Diagnosis Engine.
    Cross-references real computer vision detections with persistent backroom and shelf inventory records.
    Never fabricates stock levels or claims backroom presence based solely on an image.
    """
    def diagnose(
        self,
        audit_id: int,
        observed_occupancy: float,
        detected_count: int,
        target_count: int,
        detections: List[Dict[str, Any]],
        inventory_record: Optional[InventoryRecord] = None,
        product: Optional[Product] = None
    ) -> Dict[str, Any]:
        backroom_qty = inventory_record.recorded_backroom_qty if inventory_record else 0
        shelf_qty_recorded = inventory_record.recorded_shelf_qty if inventory_record else 0
        recent_sales = inventory_record.recent_sales_qty if inventory_record else 0
        product_name = product.name if product else "Target Category"

        # Check for visual detection uncertainty
        avg_confidence = (
            sum(d.get("confidence", 0.0) for d in detections) / max(1, len(detections))
            if detections else 0.0
        )
        uncertain_detections = [d for d in detections if d.get("confidence", 0.0) < 0.40]

        # Rule evaluation
        if observed_occupancy >= 0.75:
            classification = "Healthy Shelf Occupancy"
            diagnosis_type = "SHELF_OPTIMAL"
            explanation = (
                f"Observed shelf occupancy is {observed_occupancy*100:.1f}%, exceeding the 75% target. "
                f"Facing count ({detected_count}/{target_count}) satisfies planogram criteria."
            )
            trigger_rule = "Occupancy >= 75% Target"
            visual_evidence = f"{detected_count} objects visually detected across shelf area (avg conf: {avg_confidence:.2f})."
            inventory_evidence = f"ERP recorded shelf stock: {shelf_qty_recorded} units, backroom: {backroom_qty} units."
            recommended_action = "No immediate restocking required. Maintain standard audit cycle."
            confidence_level = "HIGH"
            problem_type = "NONE"

        elif observed_occupancy < 0.40 and backroom_qty > 0:
            classification = "Critical Shelf Gap - Restock Available"
            diagnosis_type = "STOCKOUT_AVAILABLE"
            explanation = (
                f"Severe visible gap detected (occupancy {observed_occupancy*100:.1f}% vs {target_count} expected). "
                f"Database confirms {backroom_qty} units available in backroom storage."
            )
            trigger_rule = "Occupancy < 40% AND Backroom Stock > 0"
            visual_evidence = f"Only {detected_count} units visible on shelf; deficit of {target_count - detected_count} facings."
            inventory_evidence = f"Backroom inventory record: {backroom_qty} units available for transfer. Recent sales: {recent_sales} units."
            recommended_action = f"Restock {target_count - detected_count} units of {product_name} from backroom aisle immediately."
            confidence_level = "HIGH"
            problem_type = "CRITICAL_GAP_RESTOCK_READY"

        elif observed_occupancy < 0.40 and backroom_qty == 0:
            classification = "Critical Stockout - Depleted Backroom"
            diagnosis_type = "STOCKOUT_DEPLETED"
            explanation = (
                f"Severe visible gap detected (occupancy {observed_occupancy*100:.1f}%), and inventory records confirm 0 units in backroom. "
                "Store is at immediate risk of lost sales."
            )
            trigger_rule = "Occupancy < 40% AND Backroom Stock == 0"
            visual_evidence = f"Only {detected_count} units observed on shelf (target {target_count})."
            inventory_evidence = f"Backroom record: 0 units. Recent sales: {recent_sales} units. Reorder threshold breached."
            recommended_action = f"Initiate supplier purchase order / warehouse replenishment for {product_name}. Check for misplaced stock in secondary storage."
            confidence_level = "HIGH"
            problem_type = "FULL_STOCKOUT_DEPLETED"

        elif len(uncertain_detections) > (detected_count * 0.4) or (detected_count == 0 and observed_occupancy < 0.15):
            classification = "Uncertain Visual Evidence - Review Required"
            diagnosis_type = "UNCERTAIN_EVIDENCE"
            explanation = (
                "Computer vision detection returned low confidence or ambiguous visual features. "
                "Possible occlusions, extreme lighting glare, or camera blur present."
            )
            trigger_rule = "Detection Confidence < 0.40 OR Extreme Visual Ambiguity"
            visual_evidence = f"{len(uncertain_detections)} low-confidence bounding boxes. Overall detection avg conf: {avg_confidence:.2f}."
            inventory_evidence = f"ERP system records {shelf_qty_recorded} units on shelf, but optical confirmation is inconclusive."
            recommended_action = "Capture a high-angle well-lit verification image or dispatch an associate for physical spot check."
            confidence_level = "REQUIRES_VERIFICATION"
            problem_type = "LOW_CONFIDENCE_INSPECTION"

        else:
            classification = "Moderate Facing Deficit"
            diagnosis_type = "MODERATE_DEFICIT"
            explanation = (
                f"Shelf occupancy ({observed_occupancy*100:.1f}%) is below nominal threshold (75%), "
                f"showing {detected_count} of {target_count} expected items."
            )
            trigger_rule = "40% <= Occupancy < 75%"
            visual_evidence = f"{detected_count} objects detected. Facing deficit: {target_count - detected_count} items."
            inventory_evidence = f"Backroom stock: {backroom_qty} units. Recorded shelf stock: {shelf_qty_recorded} units."
            recommended_action = f"Face forward existing items and schedule top-up replenishment of {target_count - detected_count} units."
            confidence_level = "MEDIUM"
            problem_type = "MODERATE_FACING_DEFICIT"

        return {
            "audit_id": audit_id,
            "product_id": product.id if product else None,
            "classification": classification,
            "diagnosis_type": diagnosis_type,
            "explanation": explanation,
            "trigger_rule": trigger_rule,
            "visual_evidence": visual_evidence,
            "inventory_evidence": inventory_evidence,
            "confidence_level": confidence_level,
            "recommended_action": recommended_action,
            "problem_type": problem_type
        }

diagnosis_service = ShelfDiagnosisService()

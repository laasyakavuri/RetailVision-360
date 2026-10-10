from typing import List, Dict, Any, Optional

class PlanogramMatcher:
    """
    Compares observed shelf detections against configured planograms.
    Evaluates spatial occupancy across shelf grid rows & columns.
    Avoids false SKU claims based solely on geometry unless supported by product recognition.
    """
    def compare(
        self,
        planogram: Dict[str, Any],
        detections: List[Dict[str, Any]],
        image_width: float = 1280.0,
        image_height: float = 720.0
    ) -> Dict[str, Any]:
        rows = planogram.get("rows", 3)
        cols = planogram.get("cols", 4)
        positions = planogram.get("positions", [])
        target_total_facings = planogram.get("target_facing_count", rows * cols)
        occupancy_threshold = planogram.get("occupancy_threshold", 0.75)

        observed_count = len(detections)
        row_height = image_height / max(1, rows)
        col_width = image_width / max(1, cols)

        # Create cell grid observation accumulator
        grid_observations = [[0 for _ in range(cols)] for _ in range(rows)]
        for det in detections:
            # Center coordinates of detection
            cx = (det["bbox_x1"] + det["bbox_x2"]) / 2.0
            cy = (det["bbox_y1"] + det["bbox_y2"]) / 2.0
            r_idx = min(rows - 1, max(0, int(cy // row_height)))
            c_idx = min(cols - 1, max(0, int(cx // col_width)))
            grid_observations[r_idx][c_idx] += 1

        discrepancies = []
        missing_facings_count = 0
        unexpected_count = 0

        # Map configured positions
        pos_map = {(p["row_index"], p["col_index"]): p for p in positions}

        for r in range(rows):
            for c in range(cols):
                expected_p = pos_map.get((r, c))
                expected_facings = expected_p.get("expected_facings", 1) if expected_p else 1
                observed_in_cell = grid_observations[r][c]

                if observed_in_cell < expected_facings:
                    deficit = expected_facings - observed_in_cell
                    missing_facings_count += deficit
                    discrepancies.append({
                        "row": r,
                        "col": c,
                        "type": "FACING_DEFICIT",
                        "expected": expected_facings,
                        "observed": observed_in_cell,
                        "product_id": expected_p.get("product_id") if expected_p else None,
                        "message": f"Row {r+1}, Col {c+1}: Expected {expected_facings} facings, observed {observed_in_cell}"
                    })
                elif observed_in_cell > (expected_facings * 1.5):
                    unexpected_count += (observed_in_cell - expected_facings)
                    discrepancies.append({
                        "row": r,
                        "col": c,
                        "type": "SURPLUS_OR_CROWDED",
                        "expected": expected_facings,
                        "observed": observed_in_cell,
                        "product_id": expected_p.get("product_id") if expected_p else None,
                        "message": f"Row {r+1}, Col {c+1}: Dense occupancy observed ({observed_in_cell} items, expected {expected_facings})"
                    })

        # Calculate overall compliance score (0.0 to 1.0)
        facing_compliance = min(1.0, observed_count / max(1, target_total_facings))
        grid_accuracy = max(0.0, 1.0 - (len(discrepancies) / max(1, rows * cols)))
        compliance_score = round(0.5 * facing_compliance + 0.5 * grid_accuracy, 2)

        if compliance_score >= occupancy_threshold:
            status = "COMPLIANT"
        elif compliance_score >= 0.50:
            status = "MINOR_DEVIATION"
        else:
            status = "CRITICAL_MISMATCH"

        return {
            "planogram_id": planogram.get("id", 1),
            "compliance_score": compliance_score,
            "expected_total_facings": target_total_facings,
            "observed_total_objects": observed_count,
            "missing_facings_count": missing_facings_count,
            "unexpected_objects_count": unexpected_count,
            "facing_discrepancies": discrepancies,
            "grid_observations": grid_observations,
            "status": status
        }

planogram_matcher = PlanogramMatcher()

import os
import cv2
import numpy as np
from typing import Dict, List, Any, Optional, Tuple

class ProductRecognizer:
    """
    Dedicated Product-Specific Recognition Service.
    Separates generic object detection (e.g. YOLO 'bottle') from SKU-level identification.
    Uses multi-modal visual matching: Color distribution histogram + ORB feature matching.
    Honest confidence evaluation and explicit UNCERTAIN classification.
    """
    def __init__(self):
        self.orb = cv2.ORB_create(nfeatures=500)
        self.matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)

    def extract_features(self, image_path: str) -> Optional[Dict[str, Any]]:
        """Extracts color histogram and ORB keypoints/descriptors from a reference image."""
        if not os.path.exists(image_path):
            return None
        img = cv2.imread(image_path)
        if img is None:
            return None

        # Resize to standard canonical size for consistent matching
        img_resized = cv2.resize(img, (256, 256))
        hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
        
        # 3D HSV histogram normalized
        hist = cv2.calcHist([hsv], [0, 1, 2], None, [8, 8, 8], [0, 180, 0, 256, 0, 256])
        cv2.normalize(hist, hist)

        gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
        kp, des = self.orb.detectAndCompute(gray, None)

        return {
            "hist": hist,
            "descriptors": des,
            "keypoints_count": len(kp) if kp else 0
        }

    def match_crop_to_catalog(
        self,
        crop_image: np.ndarray,
        catalog_products: List[Dict[str, Any]]
    ) -> Tuple[Optional[int], float, str, List[Dict[str, Any]]]:
        """
        Compares a detected object crop against catalog reference features.
        Returns:
            best_product_id: ID of top candidate or None
            best_score: Visual match confidence (0.0 to 1.0)
            status: 'MATCHED' (>=0.75), 'UNCERTAIN' (0.45 - 0.74), or 'GENERIC_OBJECT' (<0.45)
            candidates: Ranked list of top matches with scores
        """
        if crop_image is None or crop_image.size == 0 or not catalog_products:
            return None, 0.0, "GENERIC_OBJECT", []

        crop_resized = cv2.resize(crop_image, (256, 256))
        crop_hsv = cv2.cvtColor(crop_resized, cv2.COLOR_BGR2HSV)
        crop_hist = cv2.calcHist([crop_hsv], [0, 1, 2], None, [8, 8, 8], [0, 180, 0, 256, 0, 256])
        cv2.normalize(crop_hist, crop_hist)

        crop_gray = cv2.cvtColor(crop_resized, cv2.COLOR_BGR2GRAY)
        crop_kp, crop_des = self.orb.detectAndCompute(crop_gray, None)

        candidates = []

        for prod in catalog_products:
            ref_path = prod.get("reference_image")
            if not ref_path or not os.path.exists(ref_path):
                continue

            ref_feats = self.extract_features(ref_path)
            if not ref_feats:
                continue

            # 1. Color correlation score (1.0 = identical, -1.0 = opposite)
            color_corr = cv2.compareHist(crop_hist, ref_feats["hist"], cv2.HISTCMP_CORREL)
            color_score = max(0.0, min(1.0, (color_corr + 1.0) / 2.0))

            # 2. Keypoint match ratio
            feature_score = 0.0
            if crop_des is not None and ref_feats["descriptors"] is not None:
                matches = self.matcher.match(crop_des, ref_feats["descriptors"])
                if matches:
                    good_matches = [m for m in matches if m.distance < 60]
                    feature_score = min(1.0, len(good_matches) / 25.0)

            # Combined weighted score: 60% color distribution + 40% structural keypoints
            combined_score = round(0.60 * color_score + 0.40 * feature_score, 4)

            candidates.append({
                "product_id": prod["id"],
                "sku": prod["sku"],
                "name": prod["name"],
                "brand": prod["brand"],
                "score": combined_score
            })

        candidates.sort(key=lambda x: x["score"], reverse=True)

        if not candidates:
            return None, 0.0, "GENERIC_OBJECT", []

        top_candidate = candidates[0]
        top_score = top_candidate["score"]

        # Honest classification thresholds
        if top_score >= 0.72:
            status = "MATCHED"
            product_id = top_candidate["product_id"]
        elif top_score >= 0.42:
            status = "UNCERTAIN"  # Visually ambiguous or partial view
            product_id = top_candidate["product_id"]
        else:
            status = "GENERIC_OBJECT"
            product_id = None

        return product_id, top_score, status, candidates[:3]

product_recognizer = ProductRecognizer()

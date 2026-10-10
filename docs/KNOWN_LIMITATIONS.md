# RetailVision 360 — Known Limitations & Operational Boundaries

This document provides transparent engineering disclosures regarding the technical boundaries, physical assumptions, and operational constraints of RetailVision 360.

---

## 1. Computer Vision & Shelf Geometry

### 1.1 Monocular 2D Depth Limitations
- **Constraint**: Standard monocular retail cameras (overhead or shelf-mounted) capture a 2D projection. The system accurately quantifies front-row visible facings.
- **Limitation**: Without time-of-flight (ToF) depth cameras or LiDAR, the system cannot verify how many units are pushed behind the front-most facing ("facing depth").
- **Mitigation**: Inventory audits combine visible facing counts with ERP sales-rate models to estimate stock depletion.

### 1.2 Glare, Packaging Reflections & Dense Occlusion
- **Constraint**: High-gloss cellophane, metallic foil packaging, and intense overhead fluorescent lighting can create specular glare hotspots that alter color histograms.
- **Mitigation**: The system combines color histograms with edge-preserving ORB keypoint descriptors and flags low-contrast matches as **Uncertain — Manual Verification Required** rather than making unverified guesses.

---

## 2. Product Recognition at Scale

### 2.1 Fine-Grained Flavor & Variant Distinctions
- **Constraint**: Items sharing identical packaging geometry and color schemes (e.g., *Brand X Cola Original* vs. *Brand X Cola Zero Sugar*) may produce similar visual embeddings if the typography is small or blurred in wide-angle shots.
- **Honest Handling**: The recognition engine returns confidence scores and highlights ambiguities. If confidence drops below 0.55, the finding is categorized as requiring human confirmation.

---

## 3. Checkout Discrepancy Interpretation

### 3.1 Discrepancy is Not Proof of Theft
- **Ethical Safeguard**: A discrepancy between barcode scans and weight scales can stem from barcode scan failures, mis-calibrated tare weights, customer re-packaging, or scale drift.
- **Implementation**: Discrepancies are categorized strictly as **Operational Inventory Variances Requiring Manual Review**. The system does **not** employ facial recognition, demographic profiling, or automated accusations.

---

## 4. Video Analytics & Customer Privacy

### 4.1 Anonymous Tracking
- **Privacy Architecture**: Heatmap and zone dwell analytics rely exclusively on anonymous centroid tracking. No biometric vectors, facial identifiers, or personally identifiable information (PII) are stored or tracked.

---

## 5. External AI Service (Gemini Copilot)

### 5.1 Network & Quota Dependency
- **Constraint**: Natural-language generation via Google Gemini requires outbound HTTPS connectivity to Google AI Studio endpoints.
- **Resilience**: If the network is unavailable or the API key is not configured, the core application (CV inference, planogram comparison, task management, alerts, and analytics) continues operating without degradation.

# RetailVision 360 — 5-Minute Competition Demo Guide

This script provides a structured walkthrough designed for hackathon judges, enterprise architects, and executive audiences. It highlights the five core innovations and demonstrates that RetailVision 360 runs real computer vision and real Gemini AI integration.

---

## Preparation (1 Minute Setup)

1. Ensure the backend is running at `http://localhost:8000` and frontend at `http://localhost:5173`.
2. Open your browser to `http://localhost:5173/dashboard`.
3. Keep the sample images in `RetailVision360/sample_data/` accessible on your desktop:
   - `shelf_gap_sample.jpg` (Image exhibiting a severe stockout gap)
   - `shelf_resolved_sample.jpg` (Image of the restocked shelf with full facings)

---

## 5-Minute Live Demonstration Flow

### Minute 1: The Problem & The Executive Dashboard (`/dashboard`)
1. **The Hook**: "Most retail AI systems stop at passive object counting or heatmaps. If a shelf is empty, an alert is sent, but nobody knows if stock exists in the backroom, which task matters most, or whether the shelf was ever actually refilled. We built **Shelf-to-Action Intelligence** to close this loop."
2. **Show the Metrics**: Point to the top KPI cards:
   - Live audit count, open tasks, potential stockouts, and checkout discrepancies.
   - Note the **System Status pill**: Green "CV Model Ready (YOLOv8n CPU)" and "Gemini Copilot Ready".
   - Highlight the **Activity-over-Time** and **Zone Activity** charts.

---

### Minute 2: Capture, Genuine CV Inference & Planogram Comparison (`/shelf-audit` & `/planograms`)
1. Navigate to **Shelf Auditing** (`/shelf-audit`).
2. Click **Upload Shelf Image** and select `sample_data/shelf_gap_sample.jpg`.
3. Set Aisle to `Aisle 4 - Snacks & Beverages` and Shelf ID to `Shelf-B2`. Click **Run AI Audit**.
4. **Highlight Genuine Inference**:
   - Show the detected bounding boxes rendered around the visible cereal/beverage boxes.
   - Point out the inference latency (~100-300ms on CPU) and detected facing count (2 items).
   - Show the calculated occupancy: **25.0%** against the target of 8 items.
5. Navigate to **Planograms** (`/planograms`).
6. Open **Beverages & Cold Drinks Layout**. Click **Compare Observed Shelf**.
7. Point out the spatial grid comparison: slots 1 and 2 are filled, while slots 3 through 6 are flagged as **Empty Slots**, yielding a 33% compliance score.

---

### Minute 3: Inventory-Aware Diagnosis & Explainable Prioritization (`/shelf-to-action` & `/priority-queue`)
1. Navigate to **Shelf-to-Action** (`/shelf-to-action`).
2. Show how the system combined the CV observation with the inventory ledger:
   - Target facings: 8 | Observed: 2 | Shelf Deficit: 6 units.
   - The diagnosis engine queried product `prod-001`: recorded backroom quantity is **42 units**.
   - **Diagnosis**: *"Low Shelf Occupancy (25.0%) with 42 units confirmed in backroom."*
   - **Action**: *"Dispatch immediate replenishment task from Backroom Zone C."*
3. Navigate to **Priority Queue** (`/priority-queue`).
4. Show why this task is ranked **CRITICAL (Score: 84.5)**:
   - Click **View Score Breakdown**.
   - Show the transparent mathematical weights: Gap severity (35%), Sales velocity (25%), Backroom stock availability (20%), Task age (10%), Optical confidence (10%).
   - Contrast with a lower-priority task where backroom stock is zero (which requires a procurement order rather than immediate aisle running).

---

### Minute 4: Closed-Loop Verification (`/shelf-to-action` or `/tasks`)
1. In the active task card, emphasize the human-in-the-loop workflow:
   - "A store associate cannot simply click 'Mark Resolved' to dismiss an empty shelf."
2. Click **Verify & Close Task**.
3. Upload the post-remediation image: `sample_data/shelf_resolved_sample.jpg`.
4. Click **Run Optical Verification**:
   - The backend runs genuine CV inference on the new image.
   - Visual result: Before = 2 facings, After = 8 facings, Target = 8 facings.
   - Result: **VERIFICATION PASSED — TASK RESOLVED**.
   - The task state machine transitions to `RESOLVED` with permanent cryptographic audit timestamps.

---

### Minute 5: Grounded Gemini AI Copilot & Checkout Discrepancies
1. Click the floating **Gemini Copilot button** (or open `/ai-assistant`).
2. Click the quick prompt: *"Why is task T-001 prioritized over T-002?"*
3. Point out Gemini's response:
   - It references the exact task IDs, backroom quantities (42 units vs 0 units), and the mathematical formula.
   - It does **not** hallucinate numbers or execute arbitrary queries; it is strictly grounded in the SQLite database context.
4. Click the prompt: *"Which shelves need restocking based on current records?"*
5. Show the response with direct action links to navigate to the relevant aisles.
6. Briefly show **Checkout Monitoring** (`/checkout`):
   - Highlight session `chk-002`: barcode scanner scanned 1 item, but scale detected 1,450g (expected 500g). System flagged *"Possible checkout quantity mismatch — manual review required"*.
7. Conclude: "RetailVision 360 provides a complete, privacy-preserving, CPU-executable intelligence loop from shelf gap to verified restocking."

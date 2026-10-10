import React, { useState } from 'react';
import {
  FileText, Download, Printer, CheckCircle2, AlertTriangle,
  Layers, ShoppingBag, ShieldCheck, ArrowRight
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('executive_summary');

  const handlePrint = () => {
    window.print();
  };

  const downloadJSON = () => {
    const reportData = {
      report_name: 'RetailVision 360 Operational Intelligence Report',
      generated_at: new Date().toISOString(),
      store_code: 'STR-1042',
      store_name: 'Metro Market Flagship (Downtown 4th)',
      provenance: 'Live Database + Optical Edge Sensors',
      kpis: {
        total_shelf_audits: 4,
        average_occupancy_ratio: '58.5%',
        open_operational_tasks: 2,
        verified_resolutions_count: 1,
        checkout_scale_discrepancies: 1,
        congested_store_zones: ['Express Self-Checkout']
      },
      flagship_innovations_evaluated: [
        'Expected-versus-Observed Planogram Comparison',
        'Small-Catalog Product Recognition with Uncertainty Handling',
        'Inventory-Aware Diagnosis & Operational Recommendations',
        'Explainable Operational Priority Scoring',
        'Closed-Loop Task Management & Automated Optical Verification'
      ]
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `retailvision_report_${reportType}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-0.5 rounded font-bold bg-sky-50 text-sky-700 border border-sky-200">
              OPERATIONAL REPORTING
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive & Operational Reports</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive store auditing, planogram compliance, inventory gaps, and closed-loop verification metrics.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={downloadJSON}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="glass-card p-8 rounded-xl border border-slate-200 space-y-8 bg-white shadow-xs print:shadow-none print:border-none">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">RetailVision 360</h2>
            <p className="text-xs font-semibold text-sky-700 tracking-wider uppercase mt-0.5">
              Store Operations Intelligence Report
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Metro Market Flagship • Store #1042 • 742 Market Boulevard, Metro City
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-1">
            <p>Date: <strong className="text-slate-800">{new Date().toLocaleDateString()}</strong></p>
            <p>Engine: <strong className="text-slate-800 font-mono">YOLOv8n + Gemini 2.5</strong></p>
            <p>Classification: <strong className="text-emerald-700">Internal Audit Verified</strong></p>
          </div>
        </div>

        {/* Section 1: Executive KPI Summary */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1">
            1. Executive Operational Metrics
          </h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Shelf Audits Completed</span>
              <span className="text-2xl font-bold text-slate-900">4 Audits</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Mean Shelf Occupancy</span>
              <span className="text-2xl font-bold text-slate-900">58.5%</span>
            </div>
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-amber-700 font-bold uppercase block">Open Operational Tasks</span>
              <span className="text-2xl font-bold text-amber-700">2 Tasks</span>
            </div>
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block">CV Verified Resolutions</span>
              <span className="text-2xl font-bold text-emerald-700">1 Verified</span>
            </div>
          </div>
        </div>

        {/* Section 2: Flagship Innovations Audit */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1">
            2. Five Differentiating Innovations — Verification Log
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 flex items-start space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">1. Expected-versus-Observed Planogram Comparison:</strong>
                <p className="text-slate-600 mt-0.5">
                  Evaluated 2×4 shelf grid (Shelf B2). Verified 3 occupied facings vs 8 expected facings. Identified 5 facing voids without falsifying geometric identity.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 flex items-start space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">2. Small-Catalog Product Recognition with Honest Uncertainty:</strong>
                <p className="text-slate-600 mt-0.5">
                  Extracted HSV color histograms and ORB keypoints on candidate crops. Successfully confirmed PureGlacier Water (88% conf); occluded snacks properly classified as UNCERTAIN.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 flex items-start space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">3. Inventory-Aware Diagnosis & Operational Recommendations:</strong>
                <p className="text-slate-600 mt-0.5">
                  Cross-referenced visual gap with backroom records. Triggered "Critical Shelf Gap - Restock Available" after verifying 28 actionable units in backroom Bay B-14.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 flex items-start space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">4. Explainable Operational Priority Scoring:</strong>
                <p className="text-slate-600 mt-0.5">
                  Formula computed transparent score of 82.5/100 (CRITICAL) for Task TSK-101 based on gap severity (85), velocity (70), and verified backroom restock availability (100).
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 flex items-start space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">5. Closed-Loop Task Management & Verification:</strong>
                <p className="text-slate-600 mt-0.5">
                  Verified resolution of Task TSK-098 via automated follow-up optical analysis: Before: 2 facings, After: 8 facings, Target: 8 facings (SATISFIED).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Checkout Discrepancies & Floor Efficiency */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1">
            3. Checkout Sensor & Traffic Findings
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <strong className="text-slate-800 block">Checkout Weight Reconciliation:</strong>
              <p className="text-slate-600">
                1 active discrepancy recorded at Self-Checkout Bay 03: +145g weight surplus above scanned product. Dispatched associate for courtesy assistance.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <strong className="text-slate-800 block">Floor Bottleneck Analysis:</strong>
              <p className="text-slate-600">
                Self-checkout zone average dwell time reached 185s (target 95s) during peak afternoon traffic. Assisted registers operating within nominal 140s tolerance.
              </p>
            </div>
          </div>
        </div>

        {/* Sign-off footer */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
          <span>RetailVision 360 v1.0.0</span>
          <span>Certified Operational Decision-Support Document</span>
        </div>
      </div>
    </div>
  );
};

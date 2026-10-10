import React from 'react';
import {
  HelpCircle, Sparkles, ShieldCheck, CheckCircle2, AlertTriangle,
  Cpu, Bot, Layers, ArrowRight, ExternalLink
} from 'lucide-react';

export const HelpDocsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2">
          <span className="text-xs px-2 py-0.5 rounded font-bold bg-sky-50 text-sky-700 border border-sky-200">
            DOCUMENTATION & USER GUIDE
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">RetailVision 360 Knowledge Center</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Architectural principles, the five differentiating innovations, and operational guidelines.
        </p>
      </div>

      {/* Flagship Innovation Spotlight */}
      <div className="glass-card p-6 rounded-xl border border-teal-200 bg-teal-50/20 space-y-3">
        <div className="flex items-center space-x-2 text-teal-800 font-bold text-sm">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Flagship Innovation: SHELF-TO-ACTION INTELLIGENCE</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          Traditional retail computer vision merely detects bounding boxes and stops at visual counts. RetailVision 360 completes the entire operational cycle:
        </p>
        <div className="p-3 bg-white rounded-lg border border-teal-200 font-mono text-[11px] text-teal-900 font-semibold text-center">
          Capture → Detect → Compare → Diagnose → Prioritize → Create Task → Act → Verify → Resolve
        </div>
      </div>

      {/* The Five Differentiating Innovations */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">The Five Core Innovations</h2>

        <div className="grid grid-cols-1 gap-4 text-xs">
          <div className="glass-card p-4 rounded-xl border border-slate-200 space-y-1.5">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px]">1</span>
              <span>Expected-versus-Observed Planogram Comparison</span>
            </h3>
            <p className="text-slate-600 leading-relaxed pl-7">
              Evaluates shelf grid cells (rows and columns) against expected facings. Voids and unexpected clusters are mapped without falsely claiming geometric position proves identity unless verified by product matching.
            </p>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-200 space-y-1.5">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px]">2</span>
              <span>Small-Catalog Product Recognition with Honest Uncertainty</span>
            </h3>
            <p className="text-slate-600 leading-relaxed pl-7">
              Separates generic object detection (YOLO 'bottle') from SKU identification. Uses multi-modal HSV color histograms and ORB keypoints. If confidence is below threshold or specular glare occludes packaging, the system honestly reports <strong className="text-amber-700">UNCERTAIN</strong> rather than guessing.
            </p>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-200 space-y-1.5">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">3</span>
              <span>Inventory-Aware Diagnosis & Operational Recommendations</span>
            </h3>
            <p className="text-slate-600 leading-relaxed pl-7">
              Cross-references optical shelf gaps with persistent backroom storage records. Distinguishes between actionable voids (backroom units ready for transfer) and true stockouts (backroom depleted, requiring supplier purchase order).
            </p>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-200 space-y-1.5">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px]">4</span>
              <span>Explainable Operational Priority Scoring</span>
            </h3>
            <p className="text-slate-600 leading-relaxed pl-7">
              A transparent decision-support score from 0 to 100 calculated from: Gap Severity (35%), Demand Velocity (25%), Actionable Backroom Stock (20%), Task Age (10%), and Optical Evidence Confidence (10%). Every score exposes its underlying rationale.
            </p>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-200 space-y-1.5">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">5</span>
              <span>Closed-Loop Task Management & Automated Verification</span>
            </h3>
            <p className="text-slate-600 leading-relaxed pl-7">
              Tasks are never marked resolved simply because an associate pressed a button. A follow-up shelf photograph is submitted, genuine CV inference is re-run, and the new count is compared against the target before closing the task.
            </p>
          </div>
        </div>
      </div>

      {/* Ethical Guardrails & Limitations */}
      <div className="glass-card p-5 rounded-xl border border-slate-200 space-y-3 text-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Ethical Principles & Known Limitations</h3>
        <ul className="space-y-2 text-slate-600 list-disc pl-4 leading-relaxed">
          <li><strong>No Biometric or Demographic Profiling:</strong> The application does not implement facial recognition, emotion analysis, or demographic profiling.</li>
          <li><strong>Discrepancies are Not Accusations:</strong> Checkout scale discrepancies reflect sensor variances (e.g., personal bags on bagging scales) and trigger courteous associate assistance, not accusations.</li>
          <li><strong>Strict Database Grounding for Gemini:</strong> The Gemini Copilot does not hallucinate arbitrary store data; it operates strictly on bounded read-only queries from the SQLite database.</li>
          <li><strong>CPU Execution Default:</strong> Designed to run on standard CPU laptops (such as Intel i7) with low inference latency and without requiring high-end dedicated GPUs.</li>
        </ul>
      </div>
    </div>
  );
};

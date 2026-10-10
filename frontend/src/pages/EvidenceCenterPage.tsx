import React, { useState } from 'react';
import {
  ShieldCheck, AlertTriangle, Eye, HelpCircle, CheckCircle2,
  Filter, Search, Layers, Database, ArrowRight
} from 'lucide-react';

export const EvidenceCenterPage: React.FC = () => {
  const [filterState, setFilterState] = useState<string>('ALL');

  const evidenceRecords = [
    {
      id: 'EVD-101',
      source: 'Shelf Audit AUD-2026-001 (Aisle 1 • Shelf B2)',
      findingType: 'Critical Shelf Gap',
      state: 'SUPPORTED',
      method: 'YOLOv8 Nano (CPU) + Saturation Morphology',
      observed: '3 visible facings (37.5% occupancy)',
      threshold: 'Target: 8 facings (75% threshold)',
      inventoryContext: '28 units verified in backroom B-14',
      confidence: 0.88,
      limitations: 'High visual confidence, but occluded items behind front facings cannot be detected optically.',
      nextStep: 'Restock 6 units from backroom and capture verification image.'
    },
    {
      id: 'EVD-102',
      source: 'Shelf Audit AUD-2026-002 (Aisle 2 • Shelf C1)',
      findingType: 'Low-Confidence Ambiguity',
      state: 'UNCERTAIN',
      method: 'Multi-Modal Visual Recognizer (ORB + HSV)',
      observed: 'Single partially occluded bottle (aspect ratio 1.2)',
      threshold: 'Confidence > 0.72 required for SKU confirmation',
      inventoryContext: '10 units recorded in ERP, last sync 2h ago',
      confidence: 0.48,
      limitations: 'Camera glare on plastic packaging creates specular highlights degrading feature descriptors.',
      nextStep: 'Request human associate physical spot-check or recapture from 45° angle.'
    },
    {
      id: 'EVD-103',
      source: 'Task Verification TSK-098 (Shelf B1)',
      findingType: 'Closed-Loop Verification',
      state: 'VERIFICATION_SUCCESSFUL',
      method: 'Follow-Up Optical CV Inspection',
      observed: '8 confirmed facings detected',
      threshold: 'Target: 8 facings (100% satisfied)',
      inventoryContext: 'Associate marked restock complete; optically confirmed',
      confidence: 0.94,
      limitations: 'Verified front facings only; depth stacking not tracked.',
      nextStep: 'Close operational task and update audit log.'
    },
    {
      id: 'EVD-104',
      source: 'Checkout Session CHK-2026-8812 (SCO-03)',
      findingType: 'Scale Weight Discrepancy',
      state: 'REQUIRES_HUMAN_REVIEW',
      method: 'Load-Cell Bagging Scale Sensor Reconciliation',
      observed: 'Measured weight: 245.0g (Expected: 100.0g)',
      threshold: 'Sensor weight tolerance +/- 40.0g',
      inventoryContext: 'Scanned 1x Truffle Almonds 100g; scale registered +145g surplus',
      confidence: 0.99,
      limitations: 'Weight variance does not prove theft; customer may have placed personal handbag or phone on scale.',
      nextStep: 'Politely assist shopper at terminal SCO-03 to confirm bagging area contents.'
    }
  ];

  const filtered = filterState === 'ALL'
    ? evidenceRecords
    : evidenceRecords.filter(e => e.state === filterState);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-0.5 rounded font-bold bg-sky-50 text-sky-700 border border-sky-200">
              TRANSPARENCY & EVIDENCE
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Uncertainty & Evidence Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auditable provenance for all computer vision findings, threshold limits, sensor tolerances, and human inspection criteria.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs">
        {['ALL', 'SUPPORTED', 'UNCERTAIN', 'REQUIRES_HUMAN_REVIEW', 'VERIFICATION_SUCCESSFUL'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterState(tab)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filterState === tab
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Evidence Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((item) => (
          <div key={item.id} className="glass-card p-5 rounded-xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-500">{item.id}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                item.state === 'SUPPORTED' || item.state === 'VERIFICATION_SUCCESSFUL'
                  ? 'bg-emerald-100 text-emerald-800'
                  : item.state === 'UNCERTAIN'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {item.state.replace(/_/g, ' ')}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">{item.findingType}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{item.source}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Method Used:</span>
                <span className="font-medium text-slate-800 font-mono text-[11px]">{item.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Observation:</span>
                <span className="font-semibold text-slate-900">{item.observed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trigger Rule:</span>
                <span className="font-semibold text-slate-800">{item.threshold}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Inventory/Context:</span>
                <span className="font-medium text-slate-800">{item.inventoryContext}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Optical Confidence:</span>
                <span className="font-bold text-slate-900">{(item.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Evidence Limitations:</span>
              <p className="text-slate-600 leading-relaxed text-[11px] bg-amber-50/50 p-2 rounded border border-amber-200/50">
                {item.limitations}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Next Action:</span>
                <span className="font-semibold text-sky-800">{item.nextStep}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  CheckSquare, Sparkles, AlertTriangle, ShieldCheck, CheckCircle2,
  XCircle, RefreshCw, Layers, Eye, HelpCircle
} from 'lucide-react';
import { getProducts } from '../services/api';
import { Product } from '../types';

export const ProductRecognitionPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>('crop_pureglacier');
  const [corrections, setCorrections] = useState<Record<string, string>>({});

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error);
  }, []);

  const sampleCrops = [
    {
      id: 'crop_pureglacier',
      title: 'Candidate Bounding Box Crop #101',
      source: 'Audit AUD-2026-001 (Aisle 1 • Row 1 Col 2)',
      genericClass: 'bottle (YOLOv8 conf: 0.91)',
      colorHex: '#3b82f6',
      label: 'Blue cylindrical bottle with white crest',
      candidates: [
        { sku: 'SKU-BEV-01', name: 'PureGlacier Sparkling Water 500ml', score: 0.88, matchStatus: 'MATCHED' },
        { sku: 'SKU-BEV-03', name: 'HydroPulse Electrolyte Drink Berry', score: 0.42, matchStatus: 'UNCERTAIN' },
        { sku: 'SKU-BEV-06', name: 'SolZest Blood Orange Juice', score: 0.18, matchStatus: 'LOW' }
      ]
    },
    {
      id: 'crop_matcha',
      title: 'Candidate Bounding Box Crop #102',
      source: 'Audit AUD-2026-001 (Aisle 1 • Row 1 Col 4)',
      genericClass: 'bottle (YOLOv8 conf: 0.87)',
      colorHex: '#22c55e',
      label: 'Green slender can with dark insignia',
      candidates: [
        { sku: 'SKU-BEV-04', name: 'GreenElixir Ceremonial Matcha Latte', score: 0.82, matchStatus: 'MATCHED' },
        { sku: 'SKU-BEV-01', name: 'PureGlacier Sparkling Water 500ml', score: 0.35, matchStatus: 'LOW' },
        { sku: 'SKU-BEV-05', name: 'Heritage Artisanal Botanical Cola', score: 0.21, matchStatus: 'LOW' }
      ]
    },
    {
      id: 'crop_ambiguous',
      title: 'Candidate Bounding Box Crop #103 (Occluded)',
      source: 'Audit AUD-2026-002 (Aisle 2 • Row 2 Col 1)',
      genericClass: 'package_contour (OpenCV conf: 0.65)',
      colorHex: '#eab308',
      label: 'Yellow foil pouch with partial glare',
      candidates: [
        { sku: 'SKU-SNK-01', name: 'CrispRidge Sea Salt Kettle Chips', score: 0.54, matchStatus: 'UNCERTAIN' },
        { sku: 'SKU-SNK-04', name: 'AncientGrains Oat & Honey Crisp Bar', score: 0.48, matchStatus: 'UNCERTAIN' },
        { sku: 'SKU-SNK-02', name: 'TruffleGourmet Roasted Almonds', score: 0.31, matchStatus: 'LOW' }
      ]
    }
  ];

  const activeCrop = sampleCrops.find(c => c.id === selectedCrop) || sampleCrops[0];

  const handleConfirmMatch = (cropId: string, sku: string) => {
    setCorrections(prev => ({ ...prev, [cropId]: `Confirmed SKU: ${sku}` }));
  };

  const handleManualOverride = (cropId: string, sku: string) => {
    setCorrections(prev => ({ ...prev, [cropId]: `Associate Overrode to: ${sku}` }));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-0.5 rounded font-bold bg-teal-50 text-teal-700 border border-teal-200">
              MULTI-MODAL SKU MATCHING
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Small-Catalog Product Recognition</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Separates generic object detection (YOLO 'bottle') from SKU identification using 3D color histograms and ORB feature descriptors.
          </p>
        </div>
      </div>

      {/* Differentiating Principle Alert */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-800">Honest Confidence Policy:</strong> A generic YOLO detection like <code className="text-slate-800 font-mono">bottle</code> is never automatically reported as an exact brand without visual feature verification. When visual ambiguity or partial occlusion is detected, the engine honestly flags an <span className="font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded">UNCERTAIN</span> status and requests associate review.
        </div>
      </div>

      {/* Main Grid: Crop Selector on Left, Match Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detected Crop Selector */}
        <div className="glass-card rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Detected Object Crops</h3>
            <p className="text-[11px] text-slate-500">Bounding boxes cropped from recent shelf audits</p>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {sampleCrops.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCrop(c.id)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedCrop === c.id ? 'bg-sky-50/80 border-l-4 border-sky-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-12 rounded-lg border-2 border-slate-300 flex items-center justify-center shrink-0 shadow-xs"
                    style={{ backgroundColor: c.colorHex }}
                  >
                    <span className="text-[9px] text-white font-bold opacity-75">CROP</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{c.title}</h4>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{c.genericClass}</span>
                    {corrections[c.id] && (
                      <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
                        ✓ {corrections[c.id]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Modal Feature Matching Results */}
        <div className="lg:col-span-2 glass-card p-6 rounded-xl border border-slate-200 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Inspection:</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">{activeCrop.title}</h3>
              <p className="text-xs text-slate-500">{activeCrop.source}</p>
            </div>
            <div
              className="w-12 h-14 rounded-lg border-2 border-slate-400 flex items-center justify-center text-white text-[10px] font-bold shadow-xs"
              style={{ backgroundColor: activeCrop.colorHex }}
            >
              VISUAL
            </div>
          </div>

          {/* Visual Feature Breakdown */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Visual Signature:</span>
            <p className="text-slate-700">{activeCrop.label}</p>
            <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              <span>Matching Engine: <strong>HSV Histogram (60%) + ORB Descriptors (40%)</strong></span>
              <span>Generic Class: <strong>{activeCrop.genericClass}</strong></span>
            </div>
          </div>

          {/* Candidate Matches */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Candidate Catalog Matches:</h4>

            <div className="space-y-2.5">
              {activeCrop.candidates.map((cand, idx) => {
                const isTop = idx === 0;
                return (
                  <div
                    key={cand.sku}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isTop
                        ? cand.matchStatus === 'MATCHED'
                          ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                          : 'border-amber-300 bg-amber-50/40'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
                        <h5 className="text-xs font-bold text-slate-900">{cand.name}</h5>
                        <span className="text-[10px] font-mono text-slate-400">({cand.sku})</span>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cand.matchStatus === 'MATCHED' ? 'bg-emerald-100 text-emerald-800' :
                        cand.matchStatus === 'UNCERTAIN' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {cand.matchStatus} ({(cand.score * 100).toFixed(0)}%)
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2.5">
                      <div
                        className={`h-full rounded-full ${
                          cand.score >= 0.75 ? 'bg-emerald-500' :
                          cand.score >= 0.45 ? 'bg-amber-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${cand.score * 100}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-500">
                        {cand.score >= 0.75 ? 'High confidence visual descriptor match' :
                         cand.score >= 0.45 ? 'Partial color match; structural features uncertain' :
                         'Low feature correlation'}
                      </span>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleConfirmMatch(activeCrop.id, cand.sku)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] transition-colors cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleManualOverride(activeCrop.id, cand.sku)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] transition-colors cursor-pointer"
                        >
                          Override
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

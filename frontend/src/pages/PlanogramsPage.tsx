import React, { useState, useEffect } from 'react';
import {
  Grid, Plus, Layers, AlertTriangle, CheckCircle2, RefreshCw,
  ArrowRight, ShieldAlert, Sparkles, Filter
} from 'lucide-react';
import { getPlanograms, getShelfAudits, comparePlanogram, getProducts } from '../services/api';
import { Planogram, ShelfAudit, PlanogramCompareResult, Product } from '../types';

export const PlanogramsPage: React.FC = () => {
  const [planograms, setPlanograms] = useState<Planogram[]>([]);
  const [selectedPlanogram, setSelectedPlanogram] = useState<Planogram | null>(null);
  const [audits, setAudits] = useState<ShelfAudit[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);
  const [compareResult, setCompareResult] = useState<PlanogramCompareResult | null>(null);
  const [comparing, setComparing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pls, auds, prods] = await Promise.all([
        getPlanograms(),
        getShelfAudits(),
        getProducts()
      ]);
      setPlanograms(pls);
      if (pls.length > 0) setSelectedPlanogram(pls[0]);
      setAudits(auds);
      if (auds.length > 0) setSelectedAuditId(auds[0].id);
      setProducts(prods);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompare = async () => {
    if (!selectedPlanogram || !selectedAuditId) return;
    setComparing(true);
    try {
      const res = await comparePlanogram(selectedPlanogram.id, selectedAuditId);
      setCompareResult(res);
    } catch (err: any) {
      alert(`Planogram comparison error: ${err.message}`);
    } finally {
      setComparing(false);
    }
  };

  const getProductName = (pid?: number) => {
    if (!pid) return 'Open Facing Slot';
    const p = products.find(prod => prod.id === pid);
    return p ? p.name : `Product #${pid}`;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              SPATIAL LAYOUT ENGINE
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Planogram Management & Comparison</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Expected shelf arrangements vs genuine computer vision observations with grid facing compliance scores.
          </p>
        </div>
      </div>

      {/* Planogram Selection & Comparison Controls */}
      <div className="glass-card p-5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Select Planogram:</label>
            <select
              value={selectedPlanogram?.id || ''}
              onChange={(e) => {
                const found = planograms.find(p => p.id === Number(e.target.value));
                if (found) setSelectedPlanogram(found);
              }}
              className="text-xs border border-slate-200 rounded-lg p-2 bg-white font-medium text-slate-800"
            >
              {planograms.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.aisle} - {p.shelf})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Select Shelf Audit:</label>
            <select
              value={selectedAuditId || ''}
              onChange={(e) => setSelectedAuditId(Number(e.target.value))}
              className="text-xs border border-slate-200 rounded-lg p-2 bg-white font-medium text-slate-800"
            >
              {audits.map(a => (
                <option key={a.id} value={a.id}>{a.audit_code} ({a.aisle} • {a.shelf} • {a.total_detected_objects} objects)</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={comparing || !selectedPlanogram || !selectedAuditId}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
        >
          {comparing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>Compare Expected vs Observed</span>
        </button>
      </div>

      {/* Side-by-Side: Expected Planogram Grid vs Comparison Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expected Planogram Layout Visualizer */}
        <div className="glass-card p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Expected Shelf Layout Grid</h3>
              <p className="text-xs text-slate-500">
                {selectedPlanogram?.rows} Rows × {selectedPlanogram?.cols} Columns • Target: {selectedPlanogram?.target_facing_count} facings
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              Threshold: {((selectedPlanogram?.occupancy_threshold || 0.75) * 100)}%
            </span>
          </div>

          {/* Grid Representation */}
          <div className="grid grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-100/70 border border-slate-200">
            {selectedPlanogram?.positions.map((pos, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs text-center space-y-1 hover:border-sky-300 transition-colors"
              >
                <span className="text-[10px] font-mono font-semibold text-slate-400 block">
                  R{pos.row_index + 1} • C{pos.col_index + 1}
                </span>
                <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                  {getProductName(pos.product_id)}
                </p>
                <span className="inline-block text-[10px] font-medium text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                  {pos.expected_facings} facings
                </span>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
            <span>Location: <strong>{selectedPlanogram?.aisle} • {selectedPlanogram?.shelf}</strong></span>
            <span>Target Facings: <strong>{selectedPlanogram?.target_facing_count}</strong></span>
          </div>
        </div>

        {/* Observed vs Expected Comparison Findings */}
        <div className="glass-card p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Observed Comparison Findings</h3>
                <p className="text-xs text-slate-500">Automated spatial grid compliance evaluation</p>
              </div>

              {compareResult && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  compareResult.status === 'COMPLIANT' ? 'bg-emerald-100 text-emerald-800' :
                  compareResult.status === 'MINOR_DEVIATION' ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {compareResult.status.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            {compareResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Compliance Score</span>
                    <span className="text-xl font-bold text-slate-900">{(compareResult.compliance_score * 100).toFixed(0)}%</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200">
                    <span className="text-[10px] text-red-500 font-bold uppercase block">Missing Facings</span>
                    <span className="text-xl font-bold text-red-600">{compareResult.missing_facings_count}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase block">Observed Objects</span>
                    <span className="text-xl font-bold text-emerald-700">{compareResult.observed_total_objects}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Identified Spatial Discrepancies:</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {compareResult.facing_discrepancies.map((disc, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-slate-700">{disc.message}</span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          {disc.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                <Grid className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <span>Select an audit and click "Compare Expected vs Observed" to view spatial discrepancies</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100">
            Rule Principle: Spatial position indicates facing void, without fabricating SKU identities unless verified by Product Recognizer.
          </div>
        </div>
      </div>
    </div>
  );
};

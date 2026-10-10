import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Scale, AlertTriangle, CheckCircle2, Plus,
  ShieldCheck, RefreshCw, Layers, DollarSign, UserCheck
} from 'lucide-react';
import { getCheckoutSessions, createCheckoutSession, getProducts } from '../services/api';
import { CheckoutSession, Product } from '../types';

export const CheckoutPage: React.FC = () => {
  const [sessions, setSessions] = useState<CheckoutSession[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [location, setLocation] = useState('Self-Checkout Bay 04');
  const [registerId, setRegisterId] = useState('SCO-04');
  const [measuredWeight, setMeasuredWeight] = useState(480.0);
  const [selectedSku, setSelectedSku] = useState('SKU-BEV-01');
  const [scannedQty, setScannedQty] = useState(1);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const [sessRes, prodRes] = await Promise.all([
        getCheckoutSessions(),
        getProducts()
      ]);
      setSessions(sessRes);
      setProducts(prodRes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.sku === selectedSku);
    if (!prod) return;

    setCreating(true);
    try {
      const payload = {
        checkout_location: location,
        register_id: registerId,
        total_weight_measured: measuredWeight,
        items: [
          {
            sku: prod.sku,
            product_name: prod.name,
            quantity_scanned: scannedQty,
            unit_price: prod.unit_price,
            weight_expected: 200.0 * scannedQty // estimate
          }
        ]
      };
      const res = await createCheckoutSession(payload);
      setSessions(prev => [res, ...prev]);
      setShowModal(false);
    } catch (err: any) {
      alert(`Error creating checkout session: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
              POS & SENSOR RECONCILIATION
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Checkout Monitoring & Discrepancies</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reconciles scanned point-of-sale items against bagging scale load-cell sensors. Transparent variance indicators without biometric profiling.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Simulate Checkout Session</span>
        </button>
      </div>

      {/* Ethical Guardrail Banner */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-800">Ethical Retail Policy:</strong> Checkout scale discrepancies are treated strictly as operational reconciliation events requiring courteous customer assistance (e.g. personal items placed in bagging area, barcodes failing to scan). RetailVision 360 does not employ facial recognition or automated accusations.
        </div>
      </div>

      {/* Sessions Table */}
      <div className="glass-card rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Reconciled Checkout Sessions ({sessions.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Session Code</th>
                <th className="py-3 px-4">Register Location</th>
                <th className="py-3 px-4">Items Scanned</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Expected vs Measured Weight</th>
                <th className="py-3 px-4">Reconciliation Status</th>
                <th className="py-3 px-4">Operational Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sessions.map((s) => {
                const isDiscrepancy = s.reconciliation_status.startsWith('DISCREPANCY');
                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-sky-700">{s.session_code}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{s.checkout_location}</td>
                    <td className="py-3 px-4">{s.total_scanned_items} items</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">${s.total_scanned_amount.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono">
                      {s.total_weight_expected}g <span className="text-slate-400">vs</span> <strong>{s.total_weight_measured}g</strong>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isDiscrepancy ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {s.reconciliation_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-sm truncate">{s.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Simulate Checkout Session */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Simulate Checkout Reconciliation</h3>

            <form onSubmit={handleCreateSession} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Terminal Location:</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scanned Product:</label>
                <select
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.sku}>{p.name} (${p.unit_price})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Scanned Qty:</label>
                  <input
                    type="number"
                    min="1"
                    value={scannedQty}
                    onChange={(e) => setScannedQty(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Scale Weight (g):</label>
                  <input
                    type="number"
                    step="5"
                    value={measuredWeight}
                    onChange={(e) => setMeasuredWeight(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Tip: Enter 200g for expected weight match, or 450g+ to test sensor variance detection.
              </p>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  {creating ? 'Reconciling...' : 'Run Reconciliation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

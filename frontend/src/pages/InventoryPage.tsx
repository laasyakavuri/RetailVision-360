import React, { useState, useEffect } from 'react';
import {
  Layers, RefreshCw, Edit, TrendingUp, AlertTriangle, CheckCircle2,
  Database, Clock, Save
} from 'lucide-react';
import { getInventory, getProducts, updateInventory } from '../services/api';
import { InventoryRecord, Product } from '../types';

export const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<{ record: InventoryRecord; product?: Product } | null>(null);

  // Edit states
  const [shelfQty, setShelfQty] = useState(0);
  const [backroomQty, setBackroomQty] = useState(0);
  const [recentSales, setRecentSales] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, prodRes] = await Promise.all([
        getInventory(),
        getProducts()
      ]);
      setInventory(invRes);
      setProducts(prodRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getProductForRecord = (record: InventoryRecord) => {
    return products.find(p => p.id === record.product_id);
  };

  const handleOpenEdit = (rec: InventoryRecord) => {
    setEditingItem({ record: rec, product: getProductForRecord(rec) });
    setShelfQty(rec.recorded_shelf_qty);
    setBackroomQty(rec.recorded_backroom_qty);
    setRecentSales(rec.recent_sales_qty);
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await updateInventory({
        product_id: editingItem.record.product_id,
        recorded_shelf_qty: shelfQty,
        recorded_backroom_qty: backroomQty,
        recent_sales_qty: recentSales,
        source: 'MANUAL_ERP_ADJUSTMENT'
      });
      setEditingItem(null);
      loadData();
    } catch (err: any) {
      alert(`Error updating inventory: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200">
              ERP INVENTORY RECORDS
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Persistent Inventory & Backroom Storage</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official system of record: Tracks recorded shelf vs backroom quantities, demand velocity, and provenance sources.
          </p>
        </div>
      </div>

      {/* Critical Principle Alert */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start space-x-3">
        <Database className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-800">Architectural Principle:</strong> Backroom quantities are strictly sourced from persistent database inventory records (ERP sync or manual associate reconciliation). The application never fabricates or infers backroom stock based solely on shelf imagery.
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-card rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-4">Recorded Shelf Qty</th>
                <th className="py-3 px-4">Recorded Backroom Qty</th>
                <th className="py-3 px-4">Total Inventory</th>
                <th className="py-3 px-4">Sales Velocity</th>
                <th className="py-3 px-4">Restock Status</th>
                <th className="py-3 px-4">Provenance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {inventory.map((rec) => {
                const prod = getProductForRecord(rec);
                const isRestockReady = rec.recorded_shelf_qty <= 3 && rec.recorded_backroom_qty > 0;
                const isDepleted = rec.recorded_shelf_qty <= 3 && rec.recorded_backroom_qty === 0;

                return (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{prod ? prod.name : `Product #${rec.product_id}`}</div>
                      <div className="text-[10px] font-mono text-slate-400">{prod?.sku}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{rec.recorded_shelf_qty} units</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <span className={rec.recorded_backroom_qty === 0 ? 'text-red-600' : 'text-emerald-700'}>
                        {rec.recorded_backroom_qty} units
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {rec.recorded_shelf_qty + rec.recorded_backroom_qty} units
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {rec.sales_rate_per_hour.toFixed(1)} / hr
                    </td>
                    <td className="py-3 px-4">
                      {isRestockReady ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Restock Ready
                        </span>
                      ) : isDepleted ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                          Depleted (PO Needed)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          Optimal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">{rec.source}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(rec)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Adjust Inventory: {editingItem.product?.name || 'Product'}
            </h3>

            <form onSubmit={handleSaveUpdate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Shelf Quantity Recorded:</label>
                <input
                  type="number"
                  value={shelfQty}
                  onChange={(e) => setShelfQty(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Backroom Quantity Recorded:</label>
                <input
                  type="number"
                  value={backroomQty}
                  onChange={(e) => setBackroomQty(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Recent 24h Sales Units:</label>
                <input
                  type="number"
                  value={recentSales}
                  onChange={(e) => setRecentSales(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Save Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

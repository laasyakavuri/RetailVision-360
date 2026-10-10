import React, { useState, useEffect } from 'react';
import {
  History, Download, Camera, CheckSquare, ShoppingCart,
  FileText, Search, Filter, ShieldCheck
} from 'lucide-react';
import { getShelfAudits, getTasks, getCheckoutSessions } from '../services/api';
import { ShelfAudit, OperationalTask, CheckoutSession } from '../types';

export const AuditHistoryPage: React.FC = () => {
  const [audits, setAudits] = useState<ShelfAudit[]>([]);
  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [sessions, setSessions] = useState<CheckoutSession[]>([]);
  const [activeTab, setActiveTab] = useState<'audits' | 'tasks' | 'checkouts'>('audits');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAllHistory();
  }, []);

  const loadAllHistory = async () => {
    try {
      const [aRes, tRes, sRes] = await Promise.all([
        getShelfAudits(),
        getTasks(),
        getCheckoutSessions()
      ]);
      setAudits(aRes);
      setTasks(tRes);
      setSessions(sRes);
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    let rows: string[][] = [];
    let filename = 'export.csv';

    if (activeTab === 'audits') {
      filename = 'shelf_audits_history.csv';
      rows = [
        ['Audit Code', 'Aisle', 'Shelf', 'Timestamp', 'Objects Detected', 'Occupancy Ratio', 'Model Name', 'Status'],
        ...audits.map(a => [
          a.audit_code, a.aisle, a.shelf, a.timestamp, a.total_detected_objects.toString(),
          (a.occupancy_rate * 100).toFixed(1) + '%', a.model_name, a.status
        ])
      ];
    } else if (activeTab === 'tasks') {
      filename = 'operational_tasks_history.csv';
      rows = [
        ['Task Code', 'Location', 'Product', 'Problem Type', 'Priority Level', 'Score', 'Status', 'Assigned To', 'Created At'],
        ...tasks.map(t => [
          t.task_code, `${t.aisle} ${t.shelf}`, t.product_name || '', t.problem_type,
          t.priority_level, t.priority_score.toString(), t.status, t.assigned_to || '', t.created_at
        ])
      ];
    } else {
      filename = 'checkout_sessions_history.csv';
      rows = [
        ['Session Code', 'Location', 'Register', 'Scanned Items', 'Total Amount', 'Expected Weight (g)', 'Measured Weight (g)', 'Status'],
        ...sessions.map(s => [
          s.session_code, s.checkout_location, s.register_id, s.total_scanned_items.toString(),
          s.total_scanned_amount.toString(), s.total_weight_expected.toString(), s.total_weight_measured.toString(), s.reconciliation_status
        ])
      ];
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700 border border-slate-200">
              AUDIT LOGS
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit & Verification Event Logs</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical trace of optical shelf inspections, operational task dispatches, and POS scale reconciliations.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export {activeTab.toUpperCase()} to CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('audits')}
          className={`pb-3 px-3 transition-colors cursor-pointer border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'audits'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Shelf Audits ({audits.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 px-3 transition-colors cursor-pointer border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'tasks'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Operational Tasks ({tasks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('checkouts')}
          className={`pb-3 px-3 transition-colors cursor-pointer border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'checkouts'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Checkout Sessions ({sessions.length})</span>
        </button>
      </div>

      {/* Tables based on active tab */}
      <div className="glass-card rounded-xl border border-slate-200 overflow-hidden">
        {activeTab === 'audits' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Audit Code</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Detected Objects</th>
                  <th className="py-3 px-4">Occupancy Ratio</th>
                  <th className="py-3 px-4">Model Engine</th>
                  <th className="py-3 px-4">Inference Time</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {audits.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-sky-700">{a.audit_code}</td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-800">{a.aisle} • {a.shelf}</td>
                    <td className="py-3 px-4 text-slate-500">{a.timestamp.slice(0, 16).replace('T', ' ')}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{a.total_detected_objects} objects</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.occupancy_rate < 0.4 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {(a.occupancy_rate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">{a.model_name}</td>
                    <td className="py-3 px-4 text-slate-500">{a.inference_duration_ms} ms</td>
                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Task Code</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Problem Type</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">{t.task_code}</td>
                    <td className="py-3 px-4 font-medium">{t.aisle} • {t.shelf}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{t.product_name || 'Assorted Category'}</td>
                    <td className="py-3 px-4">{t.problem_type.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{t.priority_score.toFixed(1)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{t.assigned_to || 'Unassigned'}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{t.created_at.slice(0, 16).replace('T', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'checkouts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Session Code</th>
                  <th className="py-3 px-4">Register Location</th>
                  <th className="py-3 px-4">Scanned Items</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Weight Comparison</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-sky-700">{s.session_code}</td>
                    <td className="py-3 px-4 font-sans font-medium">{s.checkout_location}</td>
                    <td className="py-3 px-4 font-bold">{s.total_scanned_items} items</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">${s.total_scanned_amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      {s.total_weight_expected}g <span className="text-slate-400">vs</span> <strong>{s.total_weight_measured}g</strong>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        s.reconciliation_status.startsWith('DISCREPANCY')
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {s.reconciliation_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-500 max-w-sm truncate">{s.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

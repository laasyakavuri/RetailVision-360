import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, AlertTriangle, CheckCircle2, XCircle, Filter,
  Search, ShieldAlert, ArrowUpRight, Clock
} from 'lucide-react';
import { getAlerts, updateAlertStatus } from '../services/api';
import { Alert } from '../types';

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  useEffect(() => {
    loadAlerts();
  }, [statusFilter, severityFilter]);

  const loadAlerts = async () => {
    try {
      const statusParam = statusFilter === 'ALL' ? undefined : statusFilter;
      const sevParam = severityFilter === 'ALL' ? undefined : severityFilter;
      const data = await getAlerts(statusParam, sevParam);
      setAlerts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await updateAlertStatus(id, newStatus);
      loadAlerts();
    } catch (err: any) {
      alert(`Error updating alert: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-0.5 rounded font-bold bg-red-50 text-red-700 border border-red-200">
              OPERATIONAL ALERTS
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Unified Store Alert Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time notifications for shelf gaps, stockout risks, planogram shifts, and checkout weight variances.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="glass-card p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-semibold">Status:</span>
          {['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-semibold">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                severityFilter === sev
                  ? 'bg-sky-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Stream List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-400 text-xs rounded-xl border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <span>No alerts matching the selected filter criteria.</span>
          </div>
        ) : (
          alerts.map((a) => {
            const isCritical = a.severity === 'CRITICAL';
            const isHigh = a.severity === 'HIGH';

            return (
              <div
                key={a.id}
                className={`glass-card p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  a.status === 'RESOLVED' ? 'opacity-60 bg-slate-50/50' :
                  isCritical ? 'border-red-300 bg-red-50/20' :
                  isHigh ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white ${
                    isCritical ? 'bg-red-600' : isHigh ? 'bg-amber-500' : 'bg-sky-600'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{a.alert_code}</span>
                      <h4 className="text-xs font-bold text-slate-900">{a.title}</h4>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        isCritical ? 'bg-red-100 text-red-700' : isHigh ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {a.severity}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {a.alert_type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{a.message}</p>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 pt-1">
                      <span>Source: <strong>{a.source_entity_type} {a.source_entity_id}</strong></span>
                      <span>•</span>
                      <span>Created: {a.created_at.slice(0, 16).replace('T', ' ')}</span>
                      {a.resolved_at && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600">Resolved: {a.resolved_at.slice(0, 16).replace('T', ' ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-2 shrink-0">
                  {a.status === 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(a.id, 'ACKNOWLEDGED')}
                        className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-200 transition-colors cursor-pointer"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(a.id, 'RESOLVED')}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors cursor-pointer"
                      >
                        Resolve
                      </button>
                    </>
                  )}

                  {a.status === 'ACKNOWLEDGED' && (
                    <button
                      onClick={() => handleUpdateStatus(a.id, 'RESOLVED')}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                  )}

                  {a.source_entity_type === 'TASK' && (
                    <button
                      onClick={() => navigate('/shelf-to-action')}
                      className="px-3 py-1.5 text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-md border border-sky-200 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Go to Task</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

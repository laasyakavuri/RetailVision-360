import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Camera, Sparkles, AlertTriangle, CheckSquare,
  ShoppingCart, ArrowUpRight, TrendingUp, Clock, Bot,
  ShieldCheck, RefreshCw, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { getDashboardSummary, getDashboardActivity, getTasks, getAlerts } from '../services/api';
import { DashboardSummary, OperationalTask, Alert } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, actRes, taskRes, alertRes] = await Promise.all([
        getDashboardSummary(),
        getDashboardActivity(),
        getTasks('OPEN'),
        getAlerts('ACTIVE')
      ]);
      setSummary(sumRes);
      setActivity(actRes);
      setTasks(taskRes);
      setAlerts(alertRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const alertDistribution = [
    { name: 'Stockout Risk', value: alerts.filter(a => a.alert_type === 'STOCKOUT_RISK').length || 2, color: '#ef4444' },
    { name: 'Shelf Gap', value: alerts.filter(a => a.alert_type === 'SHELF_OCCUPANCY').length || 1, color: '#f59e0b' },
    { name: 'Checkout Variance', value: alerts.filter(a => a.alert_type === 'CHECKOUT_MISMATCH').length || 1, color: '#0ea5e9' },
    { name: 'Planogram Drift', value: alerts.filter(a => a.alert_type === 'PLANOGRAM_MISMATCH').length || 1, color: '#8b5cf6' }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Five Flagship Innovations Highlight */}
      <div className="rounded-xl p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white shadow-lg border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
              Flagship Innovation
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">SHELF-TO-ACTION INTELLIGENCE</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Autonomous closed-loop retail operations: Vision-based gap detection cross-referenced with backroom inventory, explainable priority scoring, associate task dispatching, and follow-up optical verification.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => navigate('/shelf-to-action')}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 text-white font-semibold text-xs rounded-lg shadow-sm shadow-teal-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Shelf-to-Action</span>
          </button>
          <button
            onClick={() => navigate('/shelf-audit')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Audit Shelf Image</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Audits</span>
            <Camera className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{summary?.total_shelf_audits || 0}</p>
          <span className="text-[10px] text-slate-500 flex items-center space-x-1 mt-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>{summary?.total_detected_objects || 0} objects bounded</span>
          </span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Stockout Risks</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{summary?.potential_stockout_alerts || 0}</p>
          <span className="text-[10px] text-red-600 font-medium mt-1 inline-block">
            Cross-referenced with ERP
          </span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Open Tasks</span>
            <CheckSquare className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{summary?.open_operational_tasks || 0}</p>
          <span className="text-[10px] text-slate-500 mt-1 inline-block">
            {summary?.unresolved_high_priority_alerts || 0} High/Critical
          </span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Verifications</span>
            <ShieldCheck className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-bold text-teal-600">{summary?.completed_verifications || 0}</p>
          <span className="text-[10px] text-teal-600 font-medium mt-1 inline-block">
            Follow-up CV verified
          </span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Checkout Gaps</span>
            <ShoppingCart className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-indigo-600">{summary?.open_checkout_discrepancies || 0}</p>
          <span className="text-[10px] text-slate-500 mt-1 inline-block">
            Scale weight variances
          </span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Copilot AI</span>
            <Bot className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-sm font-bold text-slate-900 mt-1">{summary?.gemini_available ? 'ONLINE' : 'LOCAL'}</p>
          <span className="text-[10px] text-slate-500 mt-1 inline-block font-mono">
            {summary?.gemini_model_name?.replace('gemini-', '')}
          </span>
        </div>
      </div>

      {/* Main Charts & Task Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity & Traffic Trends */}
        <div className="lg:col-span-2 glass-card p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Store Activity & Zone Traffic</h3>
              <p className="text-xs text-slate-500">Hourly foot traffic across store departments</p>
            </div>
            <button
              onClick={() => navigate('/store-analytics')}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center space-x-1"
            >
              <span>Heatmap Details</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity.length > 0 ? activity : [
                { time: '09:00', visitors: 15 },
                { time: '11:00', visitors: 38 },
                { time: '13:00', visitors: 45 },
                { time: '15:00', visitors: 28 },
                { time: '17:00', visitors: 52 },
                { time: '19:00', visitors: 34 }
              ]}>
                <defs>
                  <linearGradient id="visitorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="visitors" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#visitorGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Severity & Type Distribution */}
        <div className="glass-card p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Active Alert Types</h3>
            <p className="text-xs text-slate-500 mb-4">Categorized operational variances</p>

            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={alertDistribution} innerRadius={48} outerRadius={68} paddingAngle={4} dataKey="value">
                    {alertDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {alertDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-600">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}</span>
                </span>
                <span className="font-semibold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority Operational Tasks Queue */}
      <div className="glass-card rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Operational Priority Queue</h3>
            <p className="text-xs text-slate-500">Explainable scoring engine factoring gap severity, demand, and backroom stock</p>
          </div>
          <button
            onClick={() => navigate('/priority-queue')}
            className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center space-x-1"
          >
            <span>View Full Queue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Problem Type</th>
                <th className="py-3 px-4">Priority Score</th>
                <th className="py-3 px-4">Recommended Action</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No open operational tasks. Shelves are currently fully stocked.
                  </td>
                </tr>
              ) : (
                tasks.slice(0, 4).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-sky-600">{t.task_code}</td>
                    <td className="py-3 px-4">{t.aisle} • {t.shelf}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{t.problem_type.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{t.priority_score.toFixed(1)}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.priority_level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          t.priority_level === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {t.priority_level}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600">{t.recommended_action}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate('/shelf-to-action')}
                        className="px-2.5 py-1 text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 rounded border border-sky-200 transition-colors cursor-pointer"
                      >
                        Inspect & Verify
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

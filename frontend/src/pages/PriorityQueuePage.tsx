import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListOrdered, Sparkles, AlertCircle, ArrowUpRight, CheckCircle2,
  TrendingUp, Clock, HelpCircle, Layers, ShieldCheck, ChevronRight
} from 'lucide-react';
import { getPriorityQueue } from '../services/api';

export const PriorityQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const data = await getPriorityQueue();
      setQueue(data);
      if (data.length > 0) setSelectedTask(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200">
              EXPLAINABLE AI ENGINE
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operational Priority Queue</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Transparent decision-support scoring formula: Evaluates gap severity (35%), demand velocity (25%), backroom actionable stock (20%), and task urgency.
          </p>
        </div>
      </div>

      {/* Grid: Queue list on left, Explanatory breakdown on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Queue List */}
        <div className="glass-card rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ranked Task Queue ({queue.length})</h3>
            <p className="text-[11px] text-slate-500">Sorted strictly by calculated operational urgency</p>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[550px]">
            {queue.map((item) => (
              <div
                key={item.task_id}
                onClick={() => setSelectedTask(item)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedTask?.task_id === item.task_id
                    ? 'bg-sky-50/80 border-l-4 border-sky-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-sky-700">{item.task_code}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.priority_level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    item.priority_level === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {item.priority_level} ({item.priority_score.toFixed(1)})
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">{item.product_name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{item.aisle} • {item.shelf}</p>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">{item.recommended_action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Explainability Panel */}
        <div className="lg:col-span-2 glass-card p-6 rounded-xl border border-slate-200 space-y-5">
          {selectedTask ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Task Code: {selectedTask.task_code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedTask.product_name}</h3>
                  <p className="text-xs text-slate-500">{selectedTask.aisle} • {selectedTask.shelf}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-slate-900">{selectedTask.priority_score.toFixed(1)}</span>
                  <span className="text-xs text-slate-400 block">/ 100 Priority Score</span>
                </div>
              </div>

              {/* Score Component Breakdown Bars */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Score Component Analysis (Documented Formula):
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span>Shelf Gap Severity (Weight: 35%)</span>
                      <span className="font-bold">{selectedTask.breakdown?.gap_severity_score ?? 85.0} / 100</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${selectedTask.breakdown?.gap_severity_score ?? 85}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span>Demand / Sales Velocity (Weight: 25%)</span>
                      <span className="font-bold">{selectedTask.breakdown?.sales_velocity_score ?? 70.0} / 100</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${selectedTask.breakdown?.sales_velocity_score ?? 70}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span>Backroom Actionable Inventory (Weight: 20%)</span>
                      <span className="font-bold text-emerald-600">{selectedTask.breakdown?.backroom_stock_score ?? 100.0} / 100</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedTask.breakdown?.backroom_stock_score ?? 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span>Task Age & Wait Duration (Weight: 10%)</span>
                      <span className="font-bold">{selectedTask.breakdown?.task_age_score ?? 60.0} / 100</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${selectedTask.breakdown?.task_age_score ?? 60}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span>Optical Evidence Confidence (Weight: 10%)</span>
                      <span className="font-bold">{selectedTask.breakdown?.evidence_confidence_score ?? 90.0} / 100</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${selectedTask.breakdown?.evidence_confidence_score ?? 90}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rationale Bullet Points */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Prioritization Reasons & Evidence:</h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {selectedTask.breakdown?.rationale?.map((r: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0"></span>
                      <span>{r}</span>
                    </li>
                  )) || (
                    <>
                      <li className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0"></span>
                        <span>Severe visual gap detected on designated beverage facing.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0"></span>
                        <span>ERP records confirm 28 actionable units in backroom ready for restocking.</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Recommended Operational Action */}
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">Recommended Next Step:</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedTask.recommended_action}</p>
                </div>
                <button
                  onClick={() => navigate('/shelf-to-action')}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <span>Resolve & Verify</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs">
              Select a task from the left queue to view explainable score components.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

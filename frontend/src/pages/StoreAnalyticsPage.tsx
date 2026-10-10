import React, { useState, useEffect } from 'react';
import {
  BarChart2, Users, Clock, AlertTriangle, TrendingUp,
  MapPin, ArrowUpRight, Activity, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, AreaChart, Area
} from 'recharts';
import { getZoneAnalytics, getDwellTimeSummary } from '../services/api';
import { StoreZoneActivity } from '../types';

export const StoreAnalyticsPage: React.FC = () => {
  const [zones, setZones] = useState<StoreZoneActivity[]>([]);
  const [dwellTimes, setDwellTimes] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<StoreZoneActivity | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [zRes, dRes] = await Promise.all([
        getZoneAnalytics(),
        getDwellTimeSummary()
      ]);
      setZones(zRes);
      if (zRes.length > 0) setSelectedZone(zRes[0]);
      setDwellTimes(dRes);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              STORE FOOT TRAFFIC & EFFICIENCY
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Store Efficiency & Activity Analytics</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Zone-by-zone visitor density, average dwell times, queue congestion indicators, and bottleneck detection.
          </p>
        </div>
      </div>

      {/* Floor Plan Zone Map / Heatmap Visualizer */}
      <div className="glass-card p-6 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Interactive Store Floor Plan (Store #1042)</h3>
            <p className="text-xs text-slate-500">Click a store department to inspect live congestion and dwell times</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            Source: Edge Optical Sensors & Activity Aggregator
          </span>
        </div>

        {/* Floor Plan Visual Representation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900 text-white shadow-inner">
          {zones.map((z) => {
            const isCongested = z.congestion === 'CONGESTED';
            const isModerate = z.congestion === 'MODERATE';
            const isSelected = selectedZone?.zone_id === z.zone_id;

            return (
              <div
                key={z.zone_id}
                onClick={() => setSelectedZone(z)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-sky-400 bg-slate-800' : 'bg-slate-800/60 hover:bg-slate-800'
                } ${
                  isCongested ? 'border-red-500/80' : isModerate ? 'border-amber-500/60' : 'border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white truncate">{z.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    isCongested ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    isModerate ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {z.congestion}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-700/60">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Current Visitors</span>
                    <span className="text-base font-bold text-sky-400">{z.current_visitors}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Avg Dwell Time</span>
                    <span className="text-base font-bold text-slate-200">{z.avg_dwell_sec.toFixed(0)}s</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitors by Zone Bar Chart */}
        <div className="glass-card p-5 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Visitor Distribution by Department</h3>
          <p className="text-xs text-slate-500 mb-4">Live occupant count across active retail zones</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zones} layout="vertical">
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={130} />
                <Tooltip />
                <Bar dataKey="current_visitors" fill="#0ea5e9" radius={[0, 4, 4, 0]}>
                  {zones.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.congestion === 'CONGESTED' ? '#ef4444' : entry.congestion === 'MODERATE' ? '#f59e0b' : '#0ea5e9'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dwell Time Benchmark Chart */}
        <div className="glass-card p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Dwell Time vs Target Benchmarks</h3>
            <p className="text-xs text-slate-500 mb-4">Identifies bottlenecks and prolonged queue wait times</p>

            <div className="space-y-3 text-xs">
              {zones.map((z) => {
                const ratio = Math.min(1.5, z.avg_dwell_sec / Math.max(1, z.dwell_target_sec));
                const pct = Math.min(100, (ratio / 1.5) * 100);

                return (
                  <div key={z.zone_id}>
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span className="font-medium truncate max-w-[200px]">{z.name}</span>
                      <span className="font-mono text-slate-500">
                        <strong>{z.avg_dwell_sec.toFixed(0)}s</strong> / {z.dwell_target_sec.toFixed(0)}s target
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          ratio > 1.2 ? 'bg-red-500' : ratio > 0.9 ? 'bg-emerald-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500">
            Self-Checkout queues exceeding 180 seconds trigger associate queue-busting dispatch notifications.
          </div>
        </div>
      </div>
    </div>
  );
};

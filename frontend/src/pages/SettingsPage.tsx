import React, { useState, useEffect } from 'react';
import {
  Settings, Cpu, Bot, Database, ShieldCheck, RotateCcw,
  CheckCircle2, AlertTriangle, HardDrive, RefreshCw
} from 'lucide-react';
import { getSystemStatus, resetDemoData } from '../services/api';
import { SystemStatus } from '../types';

export const SettingsPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await getSystemStatus();
      setStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all demo data and re-seed the standard store scenario?')) return;
    setResetting(true);
    try {
      const res = await resetDemoData();
      setResetMsg(res.message);
      setTimeout(() => setResetMsg(null), 4000);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700 border border-slate-200">
              SYSTEM CONFIGURATION
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Health & Engine Settings</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Inference engine availability, device execution mode, Gemini Copilot connectivity, and data management.
          </p>
        </div>

        <button
          onClick={loadStatus}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Health</span>
        </button>
      </div>

      {resetMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{resetMsg}</span>
        </div>
      )}

      {/* Health Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Computer Vision Engine */}
        <div className="glass-card p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Computer Vision Subsystem</h3>
              <p className="text-xs text-slate-500">Ultralytics YOLOv8 Edge Detection</p>
            </div>
          </div>

          <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Model Checkpoint:</span>
              <strong className="text-slate-800 font-mono">{status?.cv_model?.name || 'yolov8n.pt'}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Execution Device:</span>
              <strong className="text-slate-800 uppercase font-mono">{status?.cv_model?.device || 'CPU'}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Inference Pipeline:</span>
              <span className="font-semibold text-emerald-600">{status?.cv_model?.mode || 'Genuine YOLOv8'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Status:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                ACTIVE & OPERATIONAL
              </span>
            </div>
          </div>
        </div>

        {/* Gemini AI Copilot */}
        <div className="glass-card p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Gemini AI Copilot</h3>
              <p className="text-xs text-slate-500">Official google-genai Python SDK</p>
            </div>
          </div>

          <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Model Identifier:</span>
              <strong className="text-slate-800 font-mono">{status?.gemini?.model || 'gemini-2.5-flash'}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">API Key Configured:</span>
              <span className="font-bold text-emerald-600 font-mono">
                {status?.gemini?.configured ? '•••••••••••••••• (Server-Side)' : 'Not Configured'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Data Grounding:</span>
              <span className="font-semibold text-sky-700">Strict SQLite Read-Only Retrieval</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Connectivity:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                status?.gemini?.available ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {status?.gemini?.available ? 'CONNECTED & VERIFIED' : 'LOCAL MODE ONLY'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage & Database Details */}
      <div className="glass-card p-6 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center space-x-3">
          <Database className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Database & Storage Engine</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 block">Database Engine:</span>
            <strong className="text-slate-800 font-mono">SQLite 3 (SQLAlchemy 2.0 ORM)</strong>
            <p className="text-[11px] text-slate-500 mt-1">Local persistent database file: retailvision360.db</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 block">Storage Directory:</span>
            <strong className="text-slate-800 font-mono truncate block">{status?.storage?.uploads_dir || 'storage/uploads'}</strong>
            <p className="text-[11px] text-slate-500 mt-1">Stores uploaded shelf images and annotated visualizations</p>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Demo Data */}
      <div className="glass-card p-6 rounded-xl border border-red-200 bg-red-50/20 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-red-900">Reset Demo Scenario</h3>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            Re-seeds the standard demo store records (Store #1042, beverage planograms, products, inventory records, and tasks) to ensure consistent demonstration workflows. Uploaded custom files will remain intact.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting Demo Data...' : 'Reset Demo Data to Factory State'}</span>
        </button>
      </div>
    </div>
  );
};

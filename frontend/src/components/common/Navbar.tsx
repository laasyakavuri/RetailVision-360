import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bell, RotateCcw, Bot, CheckCircle2, AlertTriangle,
  Building2, Search, Sparkles
} from 'lucide-react';
import { resetDemoData } from '../../services/api';

interface NavbarProps {
  onToggleAssistant: () => void;
  alertsCount?: number;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleAssistant,
  alertsCount = 0,
  onRefreshData
}) => {
  const location = useLocation();
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/dashboard': return 'Operational Intelligence Dashboard';
      case '/shelf-to-action': return 'Shelf-to-Action Flagship Workflow';
      case '/shelf-audit': return 'Smart Shelf Image Auditing & YOLO CV';
      case '/planograms': return 'Planogram Configuration & Spatial Comparison';
      case '/products': return 'Product Catalog & Facing Rules';
      case '/inventory': return 'Persistent Inventory & Backroom Storage';
      case '/product-recognition': return 'Product-Specific Multi-Modal Recognition';
      case '/priority-queue': return 'Explainable Operational Priority Engine';
      case '/evidence': return 'Uncertainty & Optical Evidence Center';
      case '/checkout': return 'Checkout Discrepancy & Scale Reconciliation';
      case '/store-analytics': return 'Store Efficiency, Traffic Heatmap & Dwell Times';
      case '/alerts': return 'Unified Store Alert Management';
      case '/audit-history': return 'Audit & Verification Event Logs';
      case '/reports': return 'Operational Reports & Data Export';
      case '/ai-assistant': return 'Gemini AI Retail Operations Copilot';
      case '/settings': return 'System Health & Engine Configuration';
      case '/help': return 'Application Guide & Five Innovations Reference';
      default: return 'Retail Operations Console';
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo scenario to initial verified state? This re-seeds the standard store inventory, tasks, and planograms.')) {
      return;
    }
    setResetting(true);
    try {
      const res = await resetDemoData();
      setResetMsg(res.message);
      if (onRefreshData) onRefreshData();
      setTimeout(() => setResetMsg(null), 3500);
    } catch (err: any) {
      alert(`Error resetting demo data: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
      {/* Title & Store context */}
      <div className="flex items-center space-x-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-slate-800">{getPageTitle(location.pathname)}</h2>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <Building2 className="w-3 h-3 text-slate-500" />
              <span>Store #1042 (Metro Downtown)</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-600">Real-time edge computer vision & inventory-grounded decision support</p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-3">
        {resetMsg && (
          <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded border border-emerald-200 font-medium flex items-center space-x-1 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{resetMsg}</span>
          </span>
        )}

        {/* Demo reset button */}
        <button
          onClick={handleResetDemo}
          disabled={resetting}
          title="Reset Seeded Demo Scenario"
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting...' : 'Reset Demo'}</span>
        </button>

        {/* Alert badge */}
        <div className="relative">
          <div className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
            <Bell className="w-4 h-4" />
            {alertsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {alertsCount}
              </span>
            )}
          </div>
        </div>

        {/* Floating AI Assistant trigger */}
        <button
          onClick={onToggleAssistant}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 shadow-sm shadow-sky-500/20 transition-all hover:shadow-md cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini Copilot</span>
        </button>
      </div>
    </header>
  );
};

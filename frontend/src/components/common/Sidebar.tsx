import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Camera, Grid, ShoppingBag, Layers,
  Sparkles, CheckSquare, ListOrdered, ShieldCheck,
  ShoppingCart, BarChart2, Bell, History, FileText,
  Bot, Settings, HelpCircle, Activity
} from 'lucide-react';

interface SidebarProps {
  demoActive?: boolean;
  cvAvailable?: boolean;
  geminiAvailable?: boolean;
}

interface NavItem {
  path: string;
  label: string;
  icon: any;
  highlight?: boolean;
  isAi?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  demoActive = true,
  cvAvailable = true,
  geminiAvailable = true
}) => {
  const navSections: NavSection[] = [
    {
      title: 'INTELLIGENCE CORE',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/shelf-to-action', label: 'Shelf-to-Action', icon: Sparkles, highlight: true },
        { path: '/shelf-audit', label: 'Shelf Auditing', icon: Camera },
        { path: '/planograms', label: 'Planograms', icon: Grid },
      ]
    },
    {
      title: 'OPERATIONS & QUEUE',
      items: [
        { path: '/priority-queue', label: 'Priority Engine', icon: ListOrdered },
        { path: '/evidence', label: 'Evidence Center', icon: ShieldCheck },
        { path: '/checkout', label: 'Checkout Monitor', icon: ShoppingCart },
        { path: '/alerts', label: 'Alert Center', icon: Bell },
      ]
    },
    {
      title: 'CATALOG & INVENTORY',
      items: [
        { path: '/products', label: 'Product Catalog', icon: ShoppingBag },
        { path: '/inventory', label: 'Inventory (Backroom)', icon: Layers },
        { path: '/product-recognition', label: 'Product Recognition', icon: CheckSquare },
      ]
    },
    {
      title: 'ANALYTICS & REPORTS',
      items: [
        { path: '/store-analytics', label: 'Store Efficiency', icon: BarChart2 },
        { path: '/audit-history', label: 'Audit History', icon: History },
        { path: '/reports', label: 'Reports & Export', icon: FileText },
      ]
    },
    {
      title: 'SYSTEM & ASSISTANT',
      items: [
        { path: '/ai-assistant', label: 'Gemini Copilot', icon: Bot, isAi: true },
        { path: '/settings', label: 'System Health', icon: Settings },
        { path: '/help', label: 'Help & Docs', icon: HelpCircle },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <h1 className="font-bold text-white text-base tracking-tight">RetailVision</h1>
            <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30">360</span>
          </div>
          <p className="text-[10px] text-slate-400 tracking-wider font-medium uppercase mt-0.5">Shelf-to-Action AI</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs font-medium">
        {navSections.map((sec, idx) => (
          <div key={idx}>
            <p className="px-2 pb-1 text-[10px] font-bold text-slate-300 tracking-wider uppercase">{sec.title}</p>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center justify-between px-2.5 py-2 rounded-md transition-colors duration-150
                      ${isActive
                        ? 'bg-sky-500/20 text-white font-semibold border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}
                      ${item.highlight ? 'ring-1 ring-teal-500/40 text-teal-300' : ''}
                    `}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${item.isAi ? 'text-sky-400' : (item.highlight ? 'text-teal-400' : '')}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.highlight && (
                      <span className="text-[9px] bg-teal-500/20 text-teal-300 font-bold px-1.5 py-0.5 rounded border border-teal-500/30">
                        FLAGSHIP
                      </span>
                    )}
                    {item.isAi && (
                      <span className="text-[9px] bg-sky-500/20 text-sky-300 font-bold px-1.5 py-0.5 rounded border border-sky-500/30">
                        AI
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* System Status Indicators Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] space-y-2">
        <div className="flex items-center justify-between px-1 text-slate-400">
          <span className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${cvAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span>Vision Engine:</span>
          </span>
          <span className="font-mono text-slate-300">{cvAvailable ? 'YOLOv8 CPU' : 'CV Fallback'}</span>
        </div>
        <div className="flex items-center justify-between px-1 text-slate-400">
          <span className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${geminiAvailable ? 'bg-sky-400' : 'bg-slate-500'}`}></span>
            <span>Gemini 2.5:</span>
          </span>
          <span className="font-mono text-slate-300">{geminiAvailable ? 'Connected' : 'Offline'}</span>
        </div>
        <div className="flex items-center justify-between px-1 text-slate-400 pt-1 border-t border-slate-800/80">
          <span>Data Provenance:</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${demoActive ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-300'}`}>
            {demoActive ? 'Demo + Real CV' : 'Production Live'}
          </span>
        </div>
      </div>
    </aside>
  );
};

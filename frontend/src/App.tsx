import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout & Common
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { GeminiDrawer } from './components/common/GeminiDrawer';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { ShelfToActionPage } from './pages/ShelfToActionPage';
import { ShelfAuditPage } from './pages/ShelfAuditPage';
import { PlanogramsPage } from './pages/PlanogramsPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { ProductRecognitionPage } from './pages/ProductRecognitionPage';
import { PriorityQueuePage } from './pages/PriorityQueuePage';
import { EvidenceCenterPage } from './pages/EvidenceCenterPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { StoreAnalyticsPage } from './pages/StoreAnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { AuditHistoryPage } from './pages/AuditHistoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpDocsPage } from './pages/HelpDocsPage';
import { AiAssistantPage } from './pages/AiAssistantPage';

// API
import { getSystemStatus, getAlerts } from './services/api';
import { SystemStatus } from './types';

export const App: React.FC = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = async () => {
    try {
      const [st, al] = await Promise.all([
        getSystemStatus(),
        getAlerts('ACTIVE')
      ]);
      setSystemStatus(st);
      setActiveAlertsCount(al.length);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased">
        {/* Navigation Sidebar */}
        <Sidebar
          demoActive={true}
          cvAvailable={systemStatus?.cv_model?.available ?? true}
          geminiAvailable={systemStatus?.gemini?.available ?? true}
        />

        {/* Workspace Container */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Bar */}
          <Navbar
            onToggleAssistant={() => setIsAssistantOpen(prev => !prev)}
            alertsCount={activeAlertsCount}
            onRefreshData={refreshStatus}
          />

          {/* Dynamic Scrollable Page Content */}
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/shelf-to-action" element={<ShelfToActionPage />} />
              <Route path="/shelf-audit" element={<ShelfAuditPage />} />
              <Route path="/planograms" element={<PlanogramsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/product-recognition" element={<ProductRecognitionPage />} />
              <Route path="/priority-queue" element={<PriorityQueuePage />} />
              <Route path="/evidence" element={<EvidenceCenterPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/store-analytics" element={<StoreAnalyticsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/audit-history" element={<AuditHistoryPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help" element={<HelpDocsPage />} />
              <Route path="/ai-assistant" element={<AiAssistantPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>

        {/* Global Floating Gemini Copilot Drawer */}
        <GeminiDrawer
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
        />
      </div>
    </BrowserRouter>
  );
};

export default App;

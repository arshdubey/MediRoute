import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DemoNoticeBanner } from './components/common/DemoNoticeBanner';
import { Navbar } from './components/common/Navbar';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { DashboardView } from './components/dashboard/DashboardView';
import { InventoryView } from './components/inventory/InventoryView';
import { ForecastingView } from './components/forecasting/ForecastingView';
import { RedistributionView } from './components/redistribution/RedistributionView';
import { EmergencyView } from './components/emergency/EmergencyView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { MatchDonorModal } from './components/redistribution/MatchDonorModal';
import { ScrollProgress } from './components/motion';

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col text-[#142536] font-sans selection:bg-[#E74732] selection:text-white relative overflow-x-hidden">
      {/* Scroll Progress Indicator at Top of Viewport */}
      <ScrollProgress />

      {/* Subtle Paper Canvas Background Layer (Zero repaint on scroll) */}
      <div 
        className="fixed inset-0 pointer-events-none -z-20 editorial-canvas-bg" 
        style={{ transform: 'translate3d(0, 0, 0)', willChange: 'transform' }} 
      />

      {/* Synthetic Demo Disclaimer Banner */}
      <DemoNoticeBanner />

      {/* Editorial Operations Navbar */}
      <Navbar onTriggerEmergencyModal={() => setCurrentTab('emergency')} />

      {/* Body Layout: Sidebar + Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Sidebar */}
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Dynamic Main View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardView onNavigateToTab={(tab) => setCurrentTab(tab as NavTab)} />
          )}
          {currentTab === 'inventory' && (
            <InventoryView onNavigateToRedistribution={() => setCurrentTab('redistribution')} />
          )}
          {currentTab === 'forecasting' && <ForecastingView />}
          {currentTab === 'redistribution' && <RedistributionView />}
          {currentTab === 'emergency' && (
            <EmergencyView onNavigateToRedistribution={() => setCurrentTab('redistribution')} />
          )}
          {currentTab === 'analytics' && <AnalyticsView />}
        </main>
      </div>

      {/* Reusable Clinical Match Donor Inspection Modal */}
      <MatchDonorModal />

      {/* Global Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

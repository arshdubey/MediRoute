import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  TrendingDown,
  ArrowLeftRight,
  Flame,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type NavTab = 'dashboard' | 'inventory' | 'forecasting' | 'redistribution' | 'emergency' | 'analytics';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { activeRecommendations, activeEmergency, impactMetrics } = useApp();

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Regional Command',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'inventory' as NavTab,
      label: 'Multi-Clinic Inventory',
      icon: Boxes,
      badge: null,
    },
    {
      id: 'forecasting' as NavTab,
      label: 'Shortage Forecasting',
      icon: TrendingDown,
      badge: null,
    },
    {
      id: 'redistribution' as NavTab,
      label: 'Smart Redistribution',
      icon: ArrowLeftRight,
      badge: activeRecommendations.length > 0 ? activeRecommendations.length : null,
      badgeColor: 'bg-[#1D3145] text-[#E74732] border border-[#2B435C]',
    },
    {
      id: 'emergency' as NavTab,
      label: 'Emergency Surge Mode',
      icon: Flame,
      badge: activeEmergency ? 'CRISIS' : null,
      badgeColor: 'bg-[#E74732] text-white',
    },
    {
      id: 'analytics' as NavTab,
      label: 'Impact & Audit Ledger',
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <aside className="w-full lg:w-60 bg-[#142536] text-[#A6B4C2] flex-shrink-0 lg:min-h-[calc(100vh-3.5rem)] flex flex-col justify-between border-r border-[#1E344A] z-20">
      <div className="p-4 space-y-5">
        {/* Editorial Subtitle / Header */}
        <div className="px-2 pt-1 pb-3 border-b border-[#1E344A] flex items-center justify-between">
          <span className="text-[10px] font-sans font-semibold tracking-widest text-[#7C90A2] uppercase">
            Operations Matrix
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E74732]" />
        </div>

        {/* Navigation list */}
        <nav className="space-y-0.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors duration-150 cursor-pointer relative rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F7F5F0] focus-visible:ring-offset-1 focus-visible:ring-offset-[#142536] ${
                  isActive
                    ? 'bg-[#1D3145] text-[#F7F5F0] font-medium'
                    : 'text-[#C5D0DC] hover:text-[#FFFFFF] hover:bg-[#1A2E42]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-[#E74732]" />
                  )}
                  <Icon
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      isActive ? 'text-[#E74732]' : 'text-[#8EA0B2]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== null && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded flex-shrink-0 ${
                      item.badgeColor || 'bg-[#1D3145] text-[#C5D0DC]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Compact Safety Rule Summary */}
        <div className="hidden lg:block bg-[#101E2C] rounded p-3 border border-[#1E344A] text-xs">
          <div className="flex items-center gap-1.5 text-[#F7F5F0] font-medium mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1D7055]" />
            <span className="text-[11px] font-sans text-[#F7F5F0]">Safety Invariant</span>
          </div>
          <p className="text-[11px] text-[#C5D0DC] leading-relaxed font-sans">
            Transfers strictly require <code className="text-[#F7F5F0] bg-[#1D3145] px-1 py-0.5 rounded font-mono">donor.postStock &ge; minReserve</code>. Donor facility is never compromised.
          </p>
          <div className="mt-2 pt-2 border-t border-[#1E344A] flex justify-between items-center text-[10px] text-[#8EA0B2]">
            <span>Adherence</span>
            <span className="text-[#4ADE80] font-mono font-bold text-xs">
              {impactMetrics.networkSafetyComplianceRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="p-3.5 border-t border-[#1E344A] hidden lg:block bg-[#0D1924]">
        <div className="flex items-center justify-between text-[11px] text-[#8EA0B2]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D7055] inline-block" />
            <span className="font-medium text-[#C5D0DC]">Optimization Engine</span>
          </div>
          <span className="text-[10px] font-mono text-[#8EA0B2]">
            v2.4
          </span>
        </div>
      </div>
    </aside>
  );
};

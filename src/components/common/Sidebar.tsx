import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  TrendingDown,
  ArrowLeftRight,
  Flame,
  BarChart3,
  ShieldCheck,
  CalendarClock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type NavTab =
  | 'dashboard'
  | 'inventory'
  | 'forecasting'
  | 'redistribution'
  | 'expiry'
  | 'emergency'
  | 'analytics';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { activeRecommendations, activeEmergency, impactMetrics, fefoRecommendations } = useApp();

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
      badgeColor: 'bg-[#BB232B] text-white',
    },
    {
      id: 'expiry' as NavTab,
      label: 'Expiry Intelligence',
      icon: CalendarClock,
      badge: fefoRecommendations.length > 0 ? fefoRecommendations.length : null,
      badgeColor: 'bg-[#FFFFFF] text-[#2C3480]',
    },
    {
      id: 'emergency' as NavTab,
      label: 'Emergency Surge Mode',
      icon: Flame,
      badge: activeEmergency ? 'CRISIS' : null,
      badgeColor: 'bg-[#BB232B] text-white',
    },
    {
      id: 'analytics' as NavTab,
      label: 'Impact & Audit Ledger',
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <aside className="w-full lg:w-60 bg-[#2C3480] text-[#FFFFFF] flex-shrink-0 lg:min-h-[calc(100vh-3.5rem)] flex flex-col justify-between border-r border-[#242A6B] z-20 shadow-lg">
      <div className="p-4 space-y-5">
        {/* Editorial Subtitle / Header */}
        <div className="px-2 pt-1 pb-3 border-b border-[#373F94] flex items-center justify-between">
          <span className="text-[10px] font-sans font-semibold tracking-widest text-[#A4AADE] uppercase">
            Operations Matrix
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#16815D]" />
        </div>

        {/* Navigation list */}
        <nav className="space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-all duration-150 cursor-pointer relative rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  isActive
                    ? 'bg-[#FFFFFF] text-[#2C3480] font-semibold shadow-md'
                    : 'text-[#E2E4F5] hover:text-[#FFFFFF] hover:bg-[#343D96]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-[#2C3480]' : 'text-[#A4AADE]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== null && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full flex-shrink-0 ${
                      isActive
                        ? 'bg-[#2C3480] text-white'
                        : item.badgeColor || 'bg-[#1F2561] text-[#FFFFFF]'
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
        <div className="hidden lg:block bg-[#1F2561] rounded-lg p-3 border border-[#373F94] text-xs">
          <div className="flex items-center gap-1.5 text-[#FFFFFF] font-medium mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16815D]" />
            <span className="text-[11px] font-sans font-semibold text-[#FFFFFF]">Safety Invariant</span>
          </div>
          <p className="text-[11px] text-[#C7CAEB] leading-relaxed font-sans">
            Transfers strictly require <code className="text-[#FFFFFF] bg-[#171B42] px-1 py-0.5 rounded font-mono text-[10px]">donor.postStock &ge; minReserve</code>. Donor safety buffer is preserved.
          </p>
          <div className="mt-2 pt-2 border-t border-[#373F94] flex justify-between items-center text-[10px] text-[#A4AADE]">
            <span>Adherence</span>
            <span className="text-[#4ADE80] font-mono font-bold text-xs">
              {impactMetrics.networkSafetyComplianceRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="p-3.5 border-t border-[#373F94] hidden lg:block bg-[#1A2054]">
        <div className="flex items-center justify-between text-[11px] text-[#A4AADE]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16815D] inline-block" />
            <span className="font-medium text-[#E2E4F5]">Optimization Engine</span>
          </div>
          <span className="text-[10px] font-mono text-[#A4AADE]">
            v2.4 FEFO
          </span>
        </div>
      </div>
    </aside>
  );
};

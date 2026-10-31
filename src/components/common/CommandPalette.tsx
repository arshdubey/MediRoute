import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  ArrowRight,
  Boxes,
  LayoutDashboard,
  TrendingDown,
  ArrowLeftRight,
  CalendarClock,
  Flame,
  BarChart3,
  Building2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  X,
  CornerDownLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavTab } from './Sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const {
    clinics,
    medicines,
    enrichedStock,
    activeRecommendations,
    fefoRecommendations,
    setSelectedClinicId,
    openMatchDonorModal,
    runGuidedDemoScenario,
    runFEFODemoScenario,
    resetToDemoSeed,
    triggerEmergency,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global hotkey: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered command items
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: Array<{
      id: string;
      category: 'Navigation' | 'Shortages' | 'Medicines' | 'Facilities' | 'Actions';
      title: string;
      subtitle: string;
      icon: React.ComponentType<{ className?: string }>;
      action: () => void;
    }> = [];

    // 1. Navigation Pages
    const navPages: Array<{ tab: NavTab; title: string; subtitle: string; icon: any }> = [
      { tab: 'dashboard', title: 'Regional Command Dashboard', subtitle: 'Regional map, critical triage queue, and health balance charts', icon: LayoutDashboard },
      { tab: 'inventory', title: 'Multi-Clinic Inventory Ledger', subtitle: 'Browse 60 batches, burn rates, lot codes, and storage conditions', icon: Boxes },
      { tab: 'forecasting', title: 'Shortage Forecasting', subtitle: '14-day and 21-day predictive depletion runway models', icon: TrendingDown },
      { tab: 'redistribution', title: 'Smart Redistribution Engine', subtitle: 'Surplus-to-deficit matching with donor safety reserve preservation', icon: ArrowLeftRight },
      { tab: 'expiry', title: 'Expiry Intelligence & FEFO Engine', subtitle: 'Wastage prevention, local feasibility modeling, and 24-day challenge', icon: CalendarClock },
      { tab: 'emergency', title: 'Emergency Surge Mode', subtitle: 'Simulate mass casualty influxes with blue-light priority routing', icon: Flame },
      { tab: 'analytics', title: 'Impact Analytics & Audit Ledger', subtitle: 'Verified session manifest, economic savings, and CSV export', icon: BarChart3 },
    ];

    navPages.forEach((p) => {
      if (!q || p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q) || p.tab.includes(q)) {
        items.push({
          id: `nav-${p.tab}`,
          category: 'Navigation',
          title: p.title,
          subtitle: p.subtitle,
          icon: p.icon,
          action: () => {
            onNavigateTab(p.tab);
            onClose();
          },
        });
      }
    });

    // 2. Critical Shortages
    const criticalItems = enrichedStock.filter((s) => s.calc.status === 'CRITICAL' || s.calc.status === 'LOW_STOCK');
    criticalItems.forEach((item) => {
      const match = !q || item.medicine.name.toLowerCase().includes(q) || item.clinic.name.toLowerCase().includes(q) || item.batchNumber.toLowerCase().includes(q);
      if (match) {
        items.push({
          id: `shortage-${item.id}`,
          category: 'Shortages',
          title: `${item.medicine.name} at ${item.clinic.code}`,
          subtitle: `Holds ${item.currentStock} units (safety: ${item.minSafetyStock}) • Runway: ${item.calc.daysUntilStockout}d • Batch #${item.batchNumber}`,
          icon: AlertTriangle,
          action: () => {
            openMatchDonorModal(item);
            onClose();
          },
        });
      }
    });

    // 3. Facilities
    clinics.forEach((c) => {
      if (!q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)) {
        items.push({
          id: `clinic-${c.id}`,
          category: 'Facilities',
          title: `${c.code} — ${c.name}`,
          subtitle: `${c.type} • ${c.bedsCapacity} beds • ${c.address}`,
          icon: Building2,
          action: () => {
            setSelectedClinicId(c.id);
            onNavigateTab('inventory');
            onClose();
          },
        });
      }
    });

    // 4. Quick Actions & Demonstrations
    const quickActions = [
      {
        id: 'action-24day',
        title: 'Launch "The 24-Day Challenge" (FEFO Expiry)',
        subtitle: 'Pinecrest Insulin Glargine surplus redistributed to Metro Hope General',
        icon: Play,
        action: () => {
          onNavigateTab('expiry');
          runFEFODemoScenario();
          onClose();
        },
      },
      {
        id: 'action-epi',
        title: 'Launch Epinephrine Shortage Walkthrough',
        subtitle: 'Resolve St. Jude 34-unit shortage from Northside Urgent Care',
        icon: Play,
        action: () => {
          onNavigateTab('dashboard');
          runGuidedDemoScenario();
          onClose();
        },
      },
      {
        id: 'action-emergency-trauma',
        title: 'Trigger Emergency: Mass Casualty Highway Collision',
        subtitle: 'Simulates 4.5x surge in IV analgesics and resuscitation fluids at Metro Hope',
        icon: Flame,
        action: () => {
          onNavigateTab('emergency');
          triggerEmergency('sc-1');
          onClose();
        },
      },
      {
        id: 'action-reset',
        title: 'Reset Demo Data to Initial Baseline',
        subtitle: 'Restores synthetic inventory, clinics, and clear audit ledger',
        icon: RotateCcw,
        action: () => {
          resetToDemoSeed();
          onClose();
        },
      },
    ];

    quickActions.forEach((a) => {
      if (!q || a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)) {
        items.push({
          id: a.id,
          category: 'Actions',
          title: a.title,
          subtitle: a.subtitle,
          icon: a.icon,
          action: a.action,
        });
      }
    });

    return items;
  }, [
    query,
    clinics,
    enrichedStock,
    onNavigateTab,
    onClose,
    openMatchDonorModal,
    setSelectedClinicId,
    runGuidedDemoScenario,
    runFEFODemoScenario,
    triggerEmergency,
    resetToDemoSeed,
  ]);

  // Handle arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#142536]/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#FFFFFF] border border-[#E2DDD5] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E2DDD5] bg-[#FFFFFF]">
          <Search className="w-5 h-5 text-[#5A6E85] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search medicines, clinics, batch numbers, or actions (e.g. 'Insulin', 'PFM', 'Reset')..."
            className="w-full text-sm font-sans text-[#142536] placeholder-[#8EA0B2] bg-transparent focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[#8EA0B2] hover:text-[#142536] p-1 rounded"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[10px] font-mono text-[#8EA0B2] bg-[#F7F5F0] border border-[#E2DDD5] px-1.5 py-0.5 rounded">
              ESC to close
            </span>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#F2EFE9] p-2">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#718294] font-sans">
              No matching medicines, clinics, or commands found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#142536] text-[#FFFFFF]'
                      : 'hover:bg-[#F7F5F0] text-[#142536]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-[#1E344A] text-[#F7F5F0]'
                          : 'bg-[#F7F5F0] text-[#5A6E85]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-medium text-xs truncate">
                          {item.title}
                        </span>
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded ${
                            isSelected
                              ? 'bg-[#1E344A] text-[#A6B4C2]'
                              : 'bg-[#EAE6DF] text-[#718294]'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] truncate font-sans ${
                          isSelected ? 'text-[#CBD5E1]' : 'text-[#718294]'
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-[#A6B4C2] flex-shrink-0">
                      <span>Jump</span>
                      <CornerDownLeft className="w-3 h-3 text-[#A6B4C2]" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 border-t border-[#E2DDD5] bg-[#FAF8F5] flex items-center justify-between text-[11px] text-[#718294] font-mono">
          <div className="flex items-center gap-3">
            <span>&uarr;&darr; Navigate</span>
            <span>&crarr; Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-[10px]">MediRoute Universal Command</span>
        </div>
      </div>
    </div>
  );
};

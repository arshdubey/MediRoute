import React from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, AlertTriangle, Flame, Search, RotateCcw } from 'lucide-react';

interface NavbarProps {
  onTriggerEmergencyModal: () => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onTriggerEmergencyModal, onOpenSearch }) => {
  const {
    clinics,
    selectedClinicId,
    setSelectedClinicId,
    activeEmergency,
    resolveEmergency,
    resetToDemoSeed,
  } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E5E5E8] transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2C3480] text-[#FFFFFF] flex items-center justify-center font-bold text-xs tracking-tight shadow-xs font-serif">
              MR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-[#080808] font-serif">
                  MediRoute
                </span>
                <span className="text-[10px] font-sans font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#F0F1FA] text-[#2C3480] border border-[#C7CAEB] hidden sm:inline-block">
                  Logistics OS
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#737373] hidden md:block -mt-0.5 font-sans">
                Regional Supply Chain &amp; Redistribution
              </p>
            </div>
          </div>

          {/* Center: Active Emergency Indicator or Network Status */}
          {activeEmergency ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#FDF3F3] border border-[#F5CACD] text-[#BB232B] text-xs font-semibold shadow-xs">
              <Flame className="w-3.5 h-3.5 text-[#BB232B] flex-shrink-0 animate-pulse" />
              <div className="truncate max-w-[200px] sm:max-w-none">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-[#BB232B] mr-1.5 font-sans">
                  Crisis Active:
                </span>
                {activeEmergency.title}
              </div>
              <button
                onClick={resolveEmergency}
                className="ml-1 text-[11px] font-semibold text-[#BB232B] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#BB232B] rounded cursor-pointer"
              >
                Stand Down
              </button>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2 text-xs text-[#737373]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16815D] inline-block" />
              <span className="font-medium">
                5 Regional Facilities Connected • Safety Invariants Verified
              </span>
            </div>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Command Search Trigger Button */}
            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#737373] bg-[#F5F5F7] hover:bg-[#E5E5E8] border border-[#E5E5E8] hover:border-[#2C3480] rounded-lg transition-all cursor-pointer font-sans"
                title="Universal Search (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-[#2C3480]" />
                <span className="text-[#080808] font-medium">Search</span>
                <kbd className="text-[10px] font-mono bg-white px-1.5 py-0.2 rounded border border-[#E5E5E8] text-[#737373]">
                  Ctrl K
                </kbd>
              </button>
            )}

            {/* Reset Demo State control */}
            <button
              type="button"
              onClick={resetToDemoSeed}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#737373] hover:text-[#080808] bg-[#F5F5F7] hover:bg-[#E5E5E8] border border-[#E5E5E8] rounded-lg transition-all cursor-pointer font-sans"
              title="Reset Demo State to Initial Baseline"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#737373]" />
              <span className="font-medium">Reset</span>
            </button>

            {/* Clinic Filter Dropdown */}
            <div className="relative flex items-center">
              <Building2 className="w-3.5 h-3.5 text-[#737373] absolute left-2.5 pointer-events-none" />
              <select
                value={selectedClinicId}
                onChange={(e) => setSelectedClinicId(e.target.value)}
                aria-label="Filter by Clinic"
                className="pl-7 pr-6 py-1.5 text-xs font-medium bg-[#F5F5F7] text-[#080808] border border-[#E5E5E8] hover:border-[#2C3480] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2C3480] focus:border-[#2C3480] transition-all cursor-pointer"
              >
                <option value="ALL">All 5 Facilities (Regional Network)</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Emergency Mode Button */}
            <button
              onClick={onTriggerEmergencyModal}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BB232B] focus-visible:ring-offset-2 shadow-xs ${
                activeEmergency
                  ? 'bg-[#BB232B] hover:bg-[#A01B22] text-white border border-[#BB232B]'
                  : 'bg-white hover:bg-[#FDF3F3] text-[#BB232B] border border-[#BB232B]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Emergency Mode</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

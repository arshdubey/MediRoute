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
    <header className="sticky top-0 z-30 bg-[#080808] border-b border-[#2D3142] transition-all shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2C3480] text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-md font-serif border border-white/10">
              MR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white font-serif">
                  MediRoute
                </span>
                <span className="text-[10px] font-sans font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#2C3480]/30 text-[#A4AADE] border border-[#2C3480]/60 hidden sm:inline-block">
                  Logistics OS
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#A0A0AA] hidden md:block -mt-0.5 font-sans">
                Regional Supply Chain &amp; Redistribution
              </p>
            </div>
          </div>

          {/* Center: Active Emergency Indicator or Network Status */}
          {activeEmergency ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#BB232B]/20 border border-[#BB232B]/60 text-white text-xs font-semibold shadow-xs">
              <Flame className="w-3.5 h-3.5 text-[#BB232B] flex-shrink-0 animate-pulse" />
              <div className="truncate max-w-[200px] sm:max-w-none">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-[#BB232B] mr-1.5 font-sans">
                  Crisis Active:
                </span>
                <span className="text-white">{activeEmergency.title}</span>
              </div>
              <button
                onClick={resolveEmergency}
                className="ml-1 text-[11px] font-semibold text-[#BB232B] hover:text-white underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#BB232B] rounded cursor-pointer transition-colors"
              >
                Stand Down
              </button>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2 text-xs text-[#A0A0AA]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16815D] inline-block shadow-[0_0_8px_#16815D]" />
              <span className="font-medium text-[#A0A0AA]">
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
                className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#A0A0AA] hover:text-white bg-[#171923] hover:bg-[#222431] border border-[#2D3142] hover:border-[#2C3480] rounded-lg transition-all cursor-pointer font-sans"
                title="Universal Search (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-[#2C3480]" />
                <span className="text-white font-medium">Search</span>
                <kbd className="text-[10px] font-mono bg-[#080808] px-1.5 py-0.5 rounded border border-[#2D3142] text-[#A0A0AA]">
                  Ctrl K
                </kbd>
              </button>
            )}

            {/* Reset Demo State control */}
            <button
              type="button"
              onClick={resetToDemoSeed}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#A0A0AA] hover:text-white bg-[#171923] hover:bg-[#222431] border border-[#2D3142] rounded-lg transition-all cursor-pointer font-sans"
              title="Reset Demo State to Initial Baseline"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#A0A0AA]" />
              <span className="font-medium">Reset</span>
            </button>

            {/* Clinic Filter Dropdown */}
            <div className="relative flex items-center">
              <Building2 className="w-3.5 h-3.5 text-[#A0A0AA] absolute left-2.5 pointer-events-none" />
              <select
                value={selectedClinicId}
                onChange={(e) => setSelectedClinicId(e.target.value)}
                aria-label="Filter by Clinic"
                className="pl-7 pr-6 py-1.5 text-xs font-medium bg-[#171923] text-white border border-[#2D3142] hover:border-[#2C3480] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2C3480] focus:border-[#2C3480] transition-all cursor-pointer"
              >
                <option value="ALL" className="bg-[#171923] text-white">All 5 Facilities (Regional Network)</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#171923] text-white">
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
                  : 'bg-[#171923] hover:bg-[#BB232B]/20 text-[#BB232B] hover:text-white border border-[#BB232B]'
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

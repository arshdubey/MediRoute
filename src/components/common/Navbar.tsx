import React from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, AlertTriangle, Flame, Search } from 'lucide-react';

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
  } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E5E3DC] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#142536] text-[#F7F5F0] flex items-center justify-center font-bold text-xs tracking-tight">
              MR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-[#142536] font-sans">
                  MediRoute
                </span>
                <span className="text-[10px] font-sans font-medium tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#EFECE4] text-[#77766F] border border-[#E5E3DC] hidden sm:inline-block">
                  Logistics
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#77766F] hidden md:block -mt-0.5 font-sans">
                Inter-Clinic Supply Redistribution
              </p>
            </div>
          </div>

          {/* Center: Active Emergency Indicator or Network Status */}
          {activeEmergency ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#FDF3F1] border border-[#F6CCC5] text-[#CB3520] text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-[#E74732] flex-shrink-0 animate-pulse" />
              <div className="truncate max-w-[200px] sm:max-w-none">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-[#CB3520] mr-1.5 font-sans">
                  Crisis Active:
                </span>
                {activeEmergency.title}
              </div>
              <button
                onClick={resolveEmergency}
                className="ml-1 text-[11px] font-semibold text-[#CB3520] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#CB3520] rounded cursor-pointer"
              >
                Stand Down
              </button>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2 text-xs text-[#77766F]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1D7055] inline-block" />
              <span className="font-medium">
                5 Regional Facilities Connected • Safety Invariants Verified
              </span>
            </div>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Command Search Trigger Button */}
            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#718294] bg-[#F7F5F0] hover:bg-[#EAE6DF] border border-[#E5E3DC] hover:border-[#142536] rounded transition-all cursor-pointer font-sans"
                title="Universal Search (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-[#5A6E85]" />
                <span className="text-[#142536] font-medium">Search</span>
                <kbd className="text-[10px] font-mono bg-white px-1.5 py-0.2 rounded border border-[#D5CFBF] text-[#718294]">
                  Ctrl K
                </kbd>
              </button>
            )}

            {/* Clinic Filter Dropdown */}
            <div className="relative flex items-center">
              <Building2 className="w-3.5 h-3.5 text-[#77766F] absolute left-2.5 pointer-events-none" />
              <select
                value={selectedClinicId}
                onChange={(e) => setSelectedClinicId(e.target.value)}
                aria-label="Filter by Clinic"
                className="pl-7 pr-6 py-1.5 text-xs font-medium bg-[#F7F5F0] text-[#142536] border border-[#E5E3DC] hover:border-[#142536] rounded focus:outline-none focus:ring-1 focus:ring-[#142536] focus:border-[#142536] transition-all cursor-pointer"
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
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E74732] focus-visible:ring-offset-2 ${
                activeEmergency
                  ? 'bg-[#E74732] hover:bg-[#CB3520] text-white border border-[#E74732]'
                  : 'bg-white hover:bg-[#FDF3F1] text-[#E74732] border border-[#E74732]'
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

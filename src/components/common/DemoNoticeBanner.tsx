import React, { useState } from 'react';
import { Info, RotateCcw, X, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DemoNoticeBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const { resetToDemoSeed } = useApp();

  if (dismissed) {
    return (
      <button
        onClick={() => setDismissed(false)}
        className="fixed bottom-4 right-4 z-40 bg-[#142536] text-[#F7F5F0] text-xs font-medium px-3 py-1.5 rounded shadow-sm hover:bg-[#0C1722] transition-colors flex items-center gap-1.5 border border-[#253D54] cursor-pointer"
        title="View Synthetic Demo Data Notice"
      >
        <Info className="w-3.5 h-3.5 text-[#E74732]" />
        <span>Demo Simulation Active</span>
      </button>
    );
  }

  return (
    <aside aria-label="Demo notice" className="bg-[#FFFFFF] border-b border-[#E5E3DC] text-[#142536] text-xs px-4 py-1.5 relative z-30 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E74732] inline-block" />
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-[#142536] flex items-center gap-1">
              Synthetic Clinical Data:
            </span>
            <span className="text-[#77766F]">
              5 facilities and 12 medicine inventory records utilize deterministic seeded values for evaluation.
            </span>
            <span className="text-[#77766F] hidden md:inline">
              — Algorithmic projections, not live municipal dispatch.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={resetToDemoSeed}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#142536] hover:text-[#E74732] bg-[#F7F5F0] hover:bg-[#E5E3DC] px-2.5 py-0.5 rounded border border-[#E5E3DC] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#142536] focus-visible:ring-offset-1"
            title="Restore initial deterministic inventory state"
          >
            <RotateCcw className="w-3 h-3 text-[#142536]" />
            <span>Reset Demo State</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-[#77766F] hover:text-[#142536] p-0.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#142536] rounded"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

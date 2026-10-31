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
        className="fixed bottom-4 right-4 z-40 bg-[#171923] text-white text-xs font-medium px-3 py-1.5 rounded shadow-lg hover:bg-[#222431] transition-colors flex items-center gap-1.5 border border-[#2D3142] cursor-pointer"
        title="View Synthetic Demo Data Notice"
      >
        <Info className="w-3.5 h-3.5 text-[#BB232B]" />
        <span>Demo Simulation Active</span>
      </button>
    );
  }

  return (
    <aside aria-label="Demo notice" className="bg-[#171923] border-b border-[#2D3142] text-white text-xs px-4 py-1.5 relative z-30 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#BB232B] inline-block" />
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-white flex items-center gap-1">
              Synthetic Clinical Data:
            </span>
            <span className="text-[#A0A0AA]">
              5 facilities and 12 medicine inventory records utilize deterministic seeded values for evaluation.
            </span>
            <span className="text-[#A0A0AA] hidden md:inline">
              — Algorithmic projections, not live municipal dispatch.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={resetToDemoSeed}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-white hover:bg-[#2C3480] bg-[#222431] px-2.5 py-0.5 rounded border border-[#2D3142] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480] focus-visible:ring-offset-1"
            title="Restore initial deterministic inventory state"
          >
            <RotateCcw className="w-3 h-3 text-[#A0A0AA]" />
            <span>Reset Demo State</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-[#A0A0AA] hover:text-white p-0.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480] rounded"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

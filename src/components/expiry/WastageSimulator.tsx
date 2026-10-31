import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  DollarSign,
  PackageCheck,
  RotateCcw,
} from 'lucide-react';
import { FEFORedistributionRecommendation } from '../../services/fefoEngine';

interface WastageSimulatorProps {
  selectedRecommendation: FEFORedistributionRecommendation | null;
  allRecommendations: FEFORedistributionRecommendation[];
  onSelectRecommendation: (rec: FEFORedistributionRecommendation) => void;
  onLaunchConfirmation: (rec: FEFORedistributionRecommendation, simulatedQty: number) => void;
}

export const WastageSimulator: React.FC<WastageSimulatorProps> = ({
  selectedRecommendation,
  allRecommendations,
  onSelectRecommendation,
  onLaunchConfirmation,
}) => {
  const currentRec = selectedRecommendation || allRecommendations[0] || null;

  const [simulatedQty, setSimulatedQty] = useState<number>(
    currentRec ? currentRec.recommendedQuantity : 0
  );

  useEffect(() => {
    if (currentRec) {
      setSimulatedQty(currentRec.recommendedQuantity);
    }
  }, [currentRec]);

  if (!currentRec) {
    return (
      <div className="bg-[#171923] p-6 rounded-lg border border-[#2D3142] text-center text-xs text-[#A0A0AA] font-sans">
        No active expiry recommendations available for simulation.
      </div>
    );
  }

  // Calculate simulated parameters
  const donorPreStock = currentRec.donorAvailableStock;
  const donorSafetyStock = currentRec.donorSafetyStock;
  const donorLocalBurn = currentRec.donorProjectedLocalBurn;
  const donorUnusedStock = currentRec.donorProjectedUnusedStock;
  const unitCost = currentRec.standardUnitCost;

  const simulatedDonorPostStock = donorPreStock - simulatedQty;
  const isDonorSafetyBreached = simulatedDonorPostStock < donorSafetyStock;
  const donorSafetyMargin = simulatedDonorPostStock - donorSafetyStock;

  const recipientPreStock = currentRec.recipientPreStock;
  const simulatedRecipientPostStock = recipientPreStock + simulatedQty;
  const recipientBurnCapacity = currentRec.recipientProjectedUsageBeforeExpiry;
  const isRecipientOverCapacity = simulatedQty > recipientBurnCapacity;

  // Wastage calculations
  const beforeWastageUnits = donorUnusedStock;
  const beforeWastageValue = beforeWastageUnits * unitCost;

  const simulatedRemainingWastageUnits = Math.max(0, donorUnusedStock - simulatedQty);
  const simulatedWastageSavedUnits = Math.min(donorUnusedStock, simulatedQty);
  const simulatedWastageSavedValue = simulatedWastageSavedUnits * unitCost;
  const simulatedReductionPercent =
    beforeWastageUnits > 0
      ? Math.round((simulatedWastageSavedUnits / beforeWastageUnits) * 100)
      : 100;

  const maxSliderLimit = Math.max(
    simulatedQty + 20,
    donorPreStock - Math.max(0, donorSafetyStock - 15)
  );

  return (
    <div className="bg-[#171923] rounded-lg border border-[#2D3142] p-5 sm:p-6 shadow-sm space-y-6">
      {/* Simulator Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#2D3142]">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h3 className="font-serif text-xl sm:text-2xl text-white font-normal tracking-tight">
              Interactive Wastage Prevention Simulator
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#222431] text-[#A0A0AA] border border-[#2D3142]">
              Deterministic Model
            </span>
          </div>
          <p className="text-xs text-[#A0A0AA] font-sans mt-0.5">
            Compare pharmaceutical expiry exposure before vs. after proposed redistribution. Adjust parameters to test clinical constraints.
          </p>
        </div>

        {/* Recommendation Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sim-batch-select" className="text-xs text-[#A0A0AA] font-sans">
            Simulated Batch:
          </label>
          <select
            id="sim-batch-select"
            value={currentRec.id}
            onChange={(e) => {
              const found = allRecommendations.find((r) => r.id === e.target.value);
              if (found) onSelectRecommendation(found);
            }}
            className="text-xs font-mono bg-[#222431] border border-[#2D3142] rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#2C3480]"
          >
            {allRecommendations.map((r) => (
              <option key={r.id} value={r.id}>
                {r.medicineName} ({r.donorClinicCode} &rarr; {r.recipientClinicCode}) [#{r.batchNumber}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Quantity Slider Control */}
      <div className="bg-[#222431] p-4 rounded-lg border border-[#2D3142] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-white font-sans">
              Test Transfer Allocation Quantity
            </span>
            <span className="text-[11px] text-[#A0A0AA] font-sans block">
              FEFO Algorithm recommended exactly{' '}
              <strong className="font-mono text-white">{currentRec.recommendedQuantity} units</strong>.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-white">
              {simulatedQty}{' '}
              <span className="text-xs text-[#A0A0AA] font-normal font-sans">units</span>
            </span>
            <button
              type="button"
              onClick={() => setSimulatedQty(currentRec.recommendedQuantity)}
              className="inline-flex items-center gap-1 text-[11px] font-sans text-[#A0A0AA] hover:text-white bg-[#171923] px-2.5 py-1 rounded-lg border border-[#2D3142] transition-colors cursor-pointer"
              title="Reset to recommended baseline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={maxSliderLimit}
          step={1}
          value={simulatedQty}
          onChange={(e) => setSimulatedQty(parseInt(e.target.value, 10))}
          className="w-full accent-[#2C3480] cursor-pointer"
        />

        <div className="flex justify-between text-[10px] font-mono text-[#A0A0AA]">
          <span>0 units (No transfer)</span>
          <span className="text-white font-semibold">Recommended: {currentRec.recommendedQuantity} units</span>
          <span>Max tested: {maxSliderLimit} units</span>
        </div>

        {/* Live Constraint Feedback Banners */}
        {isDonorSafetyBreached && (
          <div className="bg-[#BB232B]/20 border border-[#BB232B]/40 p-2.5 rounded-lg flex items-center gap-2 text-xs text-[#FF6B72] font-sans">
            <AlertTriangle className="w-4 h-4 text-[#FF6B72] flex-shrink-0" />
            <span>
              <strong>Constraint Invariant Violation:</strong> Transferring {simulatedQty} units leaves {currentRec.donorClinicCode} with {simulatedDonorPostStock} units, breaching its minimum reserve of {donorSafetyStock} units by {Math.abs(donorSafetyMargin)} units.
            </span>
          </div>
        )}

        {!isDonorSafetyBreached && isRecipientOverCapacity && (
          <div className="bg-[#D98A1A]/20 border border-[#D98A1A]/40 p-2.5 rounded-lg flex items-center gap-2 text-xs text-[#F5A623] font-sans">
            <AlertTriangle className="w-4 h-4 text-[#F5A623] flex-shrink-0" />
            <span>
              <strong>Absorption Warning:</strong> {currentRec.recipientClinicCode} is projected to consume ~{recipientBurnCapacity} units before batch expiry. Allocating {simulatedQty} units may cause secondary expiry at destination.
            </span>
          </div>
        )}

        {!isDonorSafetyBreached && !isRecipientOverCapacity && (
          <div className="bg-[#16815D]/20 border border-[#16815D]/40 p-2.5 rounded-lg flex items-center gap-2 text-xs text-[#5AA98C] font-sans">
            <ShieldCheck className="w-4 h-4 text-[#5AA98C] flex-shrink-0" />
            <span>
              <strong>All Clinical Invariants Satisfied:</strong> Donor preserves +{donorSafetyMargin} units above safety stock. Recipient absorbs 100% of transfer before expiry date.
            </span>
          </div>
        )}
      </div>

      {/* Comparative Simulation Grid: Before vs After */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scenario 1: BEFORE REDISTRIBUTION */}
        <div className="bg-[#171923] p-4 sm:p-5 rounded-lg border border-[#2D3142] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#2D3142]">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#A0A0AA]">
              Status Quo: No Redistribution
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#BB232B]/20 text-[#FF6B72] border border-[#BB232B]/40">
              Uncontrolled Expiry
            </span>
          </div>

          <div className="space-y-3 text-xs font-sans">
            <div className="flex justify-between items-center py-1 border-b border-[#2D3142]">
              <span className="text-[#A0A0AA]">Donor Starting Stock ({currentRec.donorClinicCode}):</span>
              <span className="font-mono font-semibold text-white">{donorPreStock} units</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#2D3142]">
              <span className="text-[#A0A0AA]">Local Projected Consumption (in {currentRec.daysToExpiry}d):</span>
              <span className="font-mono text-white">{donorLocalBurn} units</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#2D3142]">
              <span className="text-[#A0A0AA]">Projected Unused Stock Expiring:</span>
              <span className="font-mono font-bold text-[#FF6B72]">{beforeWastageUnits} units</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#2D3142]">
              <span className="text-[#A0A0AA]">Estimated Financial Wastage Loss:</span>
              <span className="font-mono font-bold text-[#FF6B72]">${beforeWastageValue.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#A0A0AA]">Recipient Stock Level ({currentRec.recipientClinicCode}):</span>
              <span className="font-mono text-[#A0A0AA]">{recipientPreStock} units (Runway: {currentRec.recipientPreDays}d)</span>
            </div>
          </div>

          {/* Visual Bar representation */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[11px] font-sans text-[#A0A0AA]">
              <span>Inventory Fate Breakdown</span>
              <span className="text-[#FF6B72] font-semibold">{Math.round((beforeWastageUnits / donorPreStock) * 100)}% Wasted</span>
            </div>
            <div className="h-3 w-full bg-[#222431] rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.round((donorLocalBurn / donorPreStock) * 100)}%` }}
                className="bg-[#16815D] h-full"
                title="Locally Consumed"
              />
              <div
                style={{ width: `${Math.round((beforeWastageUnits / donorPreStock) * 100)}%` }}
                className="bg-[#BB232B] h-full"
                title="Wasted to Expiry"
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#A0A0AA]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#16815D] inline-block" /> Locally Used ({donorLocalBurn})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#BB232B] inline-block" /> Expired Unused ({beforeWastageUnits})
              </span>
            </div>
          </div>
        </div>

        {/* Scenario 2: AFTER PROPOSED REDISTRIBUTION */}
        <div className="bg-[#171923] p-4 sm:p-5 rounded-lg border border-[#2D3142] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#2D3142]">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
              Simulated Redistribution Outcome
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#16815D]/20 text-[#5AA98C] border border-[#16815D]/40">
              Wastage Prevented
            </span>
          </div>

          <div className="space-y-3 text-xs font-sans">
            <div className="flex justify-between items-center py-1 border-b border-[#2D3142]">
              <span className="text-[#A0A0AA]">Transfer Quantity Dispatched:</span>
              <span className="font-mono font-bold text-white">{simulatedQty} units</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#2D3142]">
              <span className="text-[#A0A0AA]">Donor Remaining Stock:</span>
              <span
                className={`font-mono font-bold ${
                  isDonorSafetyBreached ? 'text-[#FF6B72]' : 'text-[#5AA98C]'
                }`}
              >
                {simulatedDonorPostStock} units (Reserve: {donorSafetyStock})
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#2D3142]">
              <span className="text-[#A0A0AA]">Recipient Stock Post-Transfer:</span>
              <span className="font-mono font-bold text-white">
                {simulatedRecipientPostStock} units (Absorbs 100%)
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#2D3142]">
              <span className="text-[#A0A0AA]">Wastage Saved:</span>
              <span className="font-mono font-bold text-[#5AA98C]">
                {simulatedWastageSavedUnits} units (${simulatedWastageSavedValue.toFixed(2)})
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#A0A0AA]">Wastage Reduction Efficiency:</span>
              <span className="font-mono font-bold text-[#5AA98C] text-sm">
                {simulatedReductionPercent}% Avoided
              </span>
            </div>
          </div>

          {/* Visual Bar representation */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[11px] font-sans text-[#A0A0AA]">
              <span>Inventory Fate Post-FEFO</span>
              <span className="text-[#5AA98C] font-semibold">{simulatedReductionPercent}% Preserved</span>
            </div>
            <div className="h-3 w-full bg-[#222431] rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.round((donorLocalBurn / donorPreStock) * 100)}%` }}
                className="bg-[#16815D] h-full"
                title="Locally Consumed"
              />
              <div
                style={{ width: `${Math.round((simulatedWastageSavedUnits / donorPreStock) * 100)}%` }}
                className="bg-[#2C3480] h-full"
                title="Redistributed & Consumed"
              />
              <div
                style={{ width: `${Math.round((simulatedRemainingWastageUnits / donorPreStock) * 100)}%` }}
                className="bg-[#BB232B] h-full"
                title="Remaining Waste"
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#A0A0AA]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#16815D] inline-block" /> Local ({donorLocalBurn})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#2C3480] inline-block" /> Saved via Transfer ({simulatedWastageSavedUnits})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#BB232B] inline-block" /> Residual Loss ({simulatedRemainingWastageUnits})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Action Row */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#A0A0AA] font-sans border-t border-[#2D3142]">
        <div>
          <em>Notice: Simulation model operates in sandboxed memory and does not mutate real database records until confirmed.</em>
        </div>

        <button
          type="button"
          disabled={isDonorSafetyBreached || simulatedQty <= 0}
          onClick={() => onLaunchConfirmation(currentRec, simulatedQty)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-sans font-medium text-xs transition-colors cursor-pointer shadow-sm ${
            isDonorSafetyBreached || simulatedQty <= 0
              ? 'bg-[#222431] text-[#A0A0AA] border border-[#2D3142] cursor-not-allowed'
              : 'bg-[#2C3480] text-white hover:bg-[#232a6b]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#5AA98C]" />
          <span>Proceed with Simulated Allocation ({simulatedQty} units)</span>
        </button>
      </div>
    </div>
  );
};

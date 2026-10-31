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
      <div className="bg-white p-6 rounded-lg border border-[#E5E5E8] text-center text-xs text-[#737373] font-sans">
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
    <div className="bg-white rounded-lg border border-[#E5E5E8] p-5 sm:p-6 shadow-xs space-y-6">
      {/* Simulator Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E8]">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#2C3480]" />
            <h3 className="font-serif text-xl sm:text-2xl text-[#080808] font-normal tracking-tight">
              Interactive Wastage Prevention Simulator
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#F5F5F7] text-[#737373] border border-[#E5E5E8]">
              Deterministic Model
            </span>
          </div>
          <p className="text-xs text-[#737373] font-sans mt-0.5">
            Compare pharmaceutical expiry exposure before vs. after proposed redistribution. Adjust parameters to test clinical constraints.
          </p>
        </div>

        {/* Recommendation Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sim-batch-select" className="text-xs text-[#737373] font-sans">
            Simulated Batch:
          </label>
          <select
            id="sim-batch-select"
            value={currentRec.id}
            onChange={(e) => {
              const found = allRecommendations.find((r) => r.id === e.target.value);
              if (found) onSelectRecommendation(found);
            }}
            className="text-xs font-mono bg-[#F5F5F7] border border-[#E5E5E8] rounded-lg px-3 py-1.5 text-[#080808] font-medium focus:outline-none focus:ring-1 focus:ring-[#2C3480]"
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
      <div className="bg-[#F5F5F7] p-4 rounded-lg border border-[#E5E5E8] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-[#080808] font-sans">
              Test Transfer Allocation Quantity
            </span>
            <span className="text-[11px] text-[#737373] font-sans block">
              FEFO Algorithm recommended exactly{' '}
              <strong className="font-mono text-[#080808]">{currentRec.recommendedQuantity} units</strong>.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-[#080808]">
              {simulatedQty}{' '}
              <span className="text-xs text-[#737373] font-normal font-sans">units</span>
            </span>
            <button
              type="button"
              onClick={() => setSimulatedQty(currentRec.recommendedQuantity)}
              className="inline-flex items-center gap-1 text-[11px] font-sans text-[#737373] hover:text-[#080808] bg-white px-2.5 py-1 rounded-lg border border-[#E5E5E8] transition-colors cursor-pointer"
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

        <div className="flex justify-between text-[10px] font-mono text-[#737373]">
          <span>0 units (No transfer)</span>
          <span className="text-[#080808] font-semibold">Recommended: {currentRec.recommendedQuantity} units</span>
          <span>Max tested: {maxSliderLimit} units</span>
        </div>

        {/* Live Constraint Feedback Banners */}
        {isDonorSafetyBreached && (
          <div className="bg-[#BB232B]/10 border border-[#BB232B]/30 p-2.5 rounded-lg flex items-center gap-2 text-xs text-[#BB232B] font-sans">
            <AlertTriangle className="w-4 h-4 text-[#BB232B] flex-shrink-0" />
            <span>
              <strong>Constraint Invariant Violation:</strong> Transferring {simulatedQty} units leaves {currentRec.donorClinicCode} with {simulatedDonorPostStock} units, breaching its minimum reserve of {donorSafetyStock} units by {Math.abs(donorSafetyMargin)} units.
            </span>
          </div>
        )}

        {!isDonorSafetyBreached && isRecipientOverCapacity && (
          <div className="bg-[#B87A14]/10 border border-[#B87A14]/30 p-2.5 rounded-lg flex items-center gap-2 text-xs text-[#B87A14] font-sans">
            <AlertTriangle className="w-4 h-4 text-[#B87A14] flex-shrink-0" />
            <span>
              <strong>Absorption Warning:</strong> {currentRec.recipientClinicCode} is projected to consume ~{recipientBurnCapacity} units before batch expiry. Allocating {simulatedQty} units may cause secondary expiry at destination.
            </span>
          </div>
        )}

        {!isDonorSafetyBreached && !isRecipientOverCapacity && (
          <div className="bg-[#16815D]/10 border border-[#16815D]/30 p-2.5 rounded-lg flex items-center gap-2 text-xs text-[#16815D] font-sans">
            <ShieldCheck className="w-4 h-4 text-[#16815D] flex-shrink-0" />
            <span>
              <strong>All Clinical Invariants Satisfied:</strong> Donor preserves +{donorSafetyMargin} units above safety stock. Recipient absorbs 100% of transfer before expiry date.
            </span>
          </div>
        )}
      </div>

      {/* Comparative Simulation Grid: Before vs After */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scenario 1: BEFORE REDISTRIBUTION */}
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-[#E5E5E8] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E8]">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#737373]">
              Status Quo: No Redistribution
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#BB232B]/10 text-[#BB232B] border border-[#BB232B]/30">
              Uncontrolled Expiry
            </span>
          </div>

          <div className="space-y-3 text-xs font-sans">
            <div className="flex justify-between items-center py-1 border-b border-[#E5E5E8]/60">
              <span className="text-[#737373]">Donor Starting Stock ({currentRec.donorClinicCode}):</span>
              <span className="font-mono font-semibold text-[#080808]">{donorPreStock} units</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#E5E5E8]/60">
              <span className="text-[#737373]">Local Projected Consumption (in {currentRec.daysToExpiry}d):</span>
              <span className="font-mono text-[#080808]">{donorLocalBurn} units</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#E5E5E8]/60">
              <span className="text-[#737373]">Projected Unused Stock Expiring:</span>
              <span className="font-mono font-bold text-[#BB232B]">{beforeWastageUnits} units</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#E5E5E8]/60">
              <span className="text-[#737373]">Estimated Financial Wastage Loss:</span>
              <span className="font-mono font-bold text-[#BB232B]">${beforeWastageValue.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#737373]">Recipient Stock Level ({currentRec.recipientClinicCode}):</span>
              <span className="font-mono text-[#737373]">{recipientPreStock} units (Runway: {currentRec.recipientPreDays}d)</span>
            </div>
          </div>

          {/* Visual Bar representation */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[11px] font-sans text-[#737373]">
              <span>Inventory Fate Breakdown</span>
              <span className="text-[#BB232B] font-semibold">{Math.round((beforeWastageUnits / donorPreStock) * 100)}% Wasted</span>
            </div>
            <div className="h-3 w-full bg-[#E5E5E8] rounded-full overflow-hidden flex">
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
            <div className="flex justify-between text-[10px] text-[#737373]">
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
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-[#E5E5E8] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E8]">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#080808]">
              Simulated Redistribution Outcome
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#16815D]/10 text-[#16815D] border border-[#16815D]/30">
              Wastage Prevented
            </span>
          </div>

          <div className="space-y-3 text-xs font-sans">
            <div className="flex justify-between items-center py-1 border-b border-[#E5E5E8]/60">
              <span className="text-[#737373]">Transfer Quantity Dispatched:</span>
              <span className="font-mono font-bold text-[#080808]">{simulatedQty} units</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#E5E5E8]/60">
              <span className="text-[#737373]">Donor Remaining Stock:</span>
              <span
                className={`font-mono font-bold ${
                  isDonorSafetyBreached ? 'text-[#BB232B]' : 'text-[#16815D]'
                }`}
              >
                {simulatedDonorPostStock} units (Reserve: {donorSafetyStock})
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#E5E5E8]/60">
              <span className="text-[#737373]">Recipient Stock Post-Transfer:</span>
              <span className="font-mono font-bold text-[#080808]">
                {simulatedRecipientPostStock} units (Absorbs 100%)
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#E5E5E8]/60">
              <span className="text-[#737373]">Wastage Saved:</span>
              <span className="font-mono font-bold text-[#16815D]">
                {simulatedWastageSavedUnits} units (${simulatedWastageSavedValue.toFixed(2)})
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#737373]">Wastage Reduction Efficiency:</span>
              <span className="font-mono font-bold text-[#16815D] text-sm">
                {simulatedReductionPercent}% Avoided
              </span>
            </div>
          </div>

          {/* Visual Bar representation */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[11px] font-sans text-[#737373]">
              <span>Inventory Fate Post-FEFO</span>
              <span className="text-[#16815D] font-semibold">{simulatedReductionPercent}% Preserved</span>
            </div>
            <div className="h-3 w-full bg-[#E5E5E8] rounded-full overflow-hidden flex">
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
            <div className="flex justify-between text-[10px] text-[#737373]">
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
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#737373] font-sans border-t border-[#E5E5E8]">
        <div>
          <em>Notice: Simulation model operates in sandboxed memory and does not mutate real database records until confirmed.</em>
        </div>

        <button
          type="button"
          disabled={isDonorSafetyBreached || simulatedQty <= 0}
          onClick={() => onLaunchConfirmation(currentRec, simulatedQty)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-sans font-medium text-xs transition-colors cursor-pointer shadow-xs ${
            isDonorSafetyBreached || simulatedQty <= 0
              ? 'bg-[#E5E5E8] text-[#737373] cursor-not-allowed'
              : 'bg-[#2C3480] text-white hover:bg-[#232a6b]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#16815D]" />
          <span>Proceed with Simulated Allocation ({simulatedQty} units)</span>
        </button>
      </div>
    </div>
  );
};

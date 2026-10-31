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
      <div className="bg-[#FFFFFF] p-6 rounded border border-[#E2DDD5] text-center text-xs text-[#718294] font-sans">
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
    <div className="bg-[#FFFFFF] rounded border border-[#E2DDD5] p-5 sm:p-6 shadow-xs space-y-6">
      {/* Simulator Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E2DDD5]">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#142536]" />
            <h3 className="font-serif text-xl sm:text-2xl text-[#142536] font-normal tracking-tight">
              Interactive Wastage Prevention Simulator
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F7F5F0] text-[#5A6E85] border border-[#E2DDD5]">
              Deterministic Model
            </span>
          </div>
          <p className="text-xs text-[#718294] font-sans mt-0.5">
            Compare pharmaceutical expiry exposure before vs. after proposed redistribution. Adjust parameters to test clinical constraints.
          </p>
        </div>

        {/* Recommendation Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sim-batch-select" className="text-xs text-[#5A6E85] font-sans">
            Simulated Batch:
          </label>
          <select
            id="sim-batch-select"
            value={currentRec.id}
            onChange={(e) => {
              const found = allRecommendations.find((r) => r.id === e.target.value);
              if (found) onSelectRecommendation(found);
            }}
            className="text-xs font-mono bg-[#F7F5F0] border border-[#E2DDD5] rounded px-3 py-1.5 text-[#142536] font-medium focus:outline-none focus:ring-1 focus:ring-[#142536]"
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
      <div className="bg-[#F7F5F0] p-4 rounded border border-[#E2DDD5] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-[#142536] font-sans">
              Test Transfer Allocation Quantity
            </span>
            <span className="text-[11px] text-[#718294] font-sans block">
              FEFO Algorithm recommended exactly{' '}
              <strong className="font-mono text-[#142536]">{currentRec.recommendedQuantity} units</strong>.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-[#142536]">
              {simulatedQty}{' '}
              <span className="text-xs text-[#5A6E85] font-normal font-sans">units</span>
            </span>
            <button
              type="button"
              onClick={() => setSimulatedQty(currentRec.recommendedQuantity)}
              className="inline-flex items-center gap-1 text-[11px] font-sans text-[#5A6E85] hover:text-[#142536] bg-[#FFFFFF] px-2.5 py-1 rounded border border-[#D5CFBF] transition-colors"
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
          className="w-full accent-[#142536] cursor-pointer"
        />

        <div className="flex justify-between text-[10px] font-mono text-[#718294]">
          <span>0 units (No transfer)</span>
          <span className="text-[#142536] font-semibold">Recommended: {currentRec.recommendedQuantity} units</span>
          <span>Max tested: {maxSliderLimit} units</span>
        </div>

        {/* Live Constraint Feedback Banners */}
        {isDonorSafetyBreached && (
          <div className="bg-[#FDF3F1] border border-[#E74732] p-2.5 rounded flex items-center gap-2 text-xs text-[#8C3A2F] font-sans">
            <AlertTriangle className="w-4 h-4 text-[#E74732] flex-shrink-0" />
            <span>
              <strong>Constraint Invariant Violation:</strong> Transferring {simulatedQty} units leaves {currentRec.donorClinicCode} with {simulatedDonorPostStock} units, breaching its minimum reserve of {donorSafetyStock} units by {Math.abs(donorSafetyMargin)} units.
            </span>
          </div>
        )}

        {!isDonorSafetyBreached && isRecipientOverCapacity && (
          <div className="bg-[#FFF9F2] border border-[#F59E0B] p-2.5 rounded flex items-center gap-2 text-xs text-[#B45309] font-sans">
            <AlertTriangle className="w-4 h-4 text-[#D97706] flex-shrink-0" />
            <span>
              <strong>Absorption Warning:</strong> {currentRec.recipientClinicCode} is projected to consume ~{recipientBurnCapacity} units before batch expiry. Allocating {simulatedQty} units may cause secondary expiry at destination.
            </span>
          </div>
        )}

        {!isDonorSafetyBreached && !isRecipientOverCapacity && (
          <div className="bg-[#E8F5E9] border border-[#A5D6A7] p-2.5 rounded flex items-center gap-2 text-xs text-[#1D7055] font-sans">
            <ShieldCheck className="w-4 h-4 text-[#1D7055] flex-shrink-0" />
            <span>
              <strong>All Clinical Invariants Satisfied:</strong> Donor preserves +{donorSafetyMargin} units above safety stock. Recipient absorbs 100% of transfer before expiry date.
            </span>
          </div>
        )}
      </div>

      {/* Comparative Simulation Grid: Before vs After */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scenario 1: BEFORE REDISTRIBUTION */}
        <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded border border-[#E2DDD5] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2DDD5]">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#718294]">
              Status Quo: No Redistribution
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FDF3F1] text-[#E74732] border border-[#E74732]">
              Uncontrolled Expiry
            </span>
          </div>

          <div className="space-y-3 text-xs font-sans">
            <div className="flex justify-between items-center py-1 border-b border-[#F2EFE9]">
              <span className="text-[#5A6E85]">Donor Starting Stock ({currentRec.donorClinicCode}):</span>
              <span className="font-mono font-semibold text-[#142536]">{donorPreStock} units</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#F2EFE9]">
              <span className="text-[#5A6E85]">Local Projected Consumption (in {currentRec.daysToExpiry}d):</span>
              <span className="font-mono text-[#142536]">{donorLocalBurn} units</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#F2EFE9]">
              <span className="text-[#5A6E85]">Projected Unused Stock Expiring:</span>
              <span className="font-mono font-bold text-[#E74732]">{beforeWastageUnits} units</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#F2EFE9]">
              <span className="text-[#5A6E85]">Estimated Financial Wastage Loss:</span>
              <span className="font-mono font-bold text-[#E74732]">${beforeWastageValue.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#5A6E85]">Recipient Stock Level ({currentRec.recipientClinicCode}):</span>
              <span className="font-mono text-[#718294]">{recipientPreStock} units (Runway: {currentRec.recipientPreDays}d)</span>
            </div>
          </div>

          {/* Visual Bar representation */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[11px] font-sans text-[#718294]">
              <span>Inventory Fate Breakdown</span>
              <span className="text-[#E74732] font-semibold">{Math.round((beforeWastageUnits / donorPreStock) * 100)}% Wasted</span>
            </div>
            <div className="h-3 w-full bg-[#EAE6DF] rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.round((donorLocalBurn / donorPreStock) * 100)}%` }}
                className="bg-[#1D7055] h-full"
                title="Locally Consumed"
              />
              <div
                style={{ width: `${Math.round((beforeWastageUnits / donorPreStock) * 100)}%` }}
                className="bg-[#E74732] h-full"
                title="Wasted to Expiry"
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#718294]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#1D7055] inline-block" /> Locally Used ({donorLocalBurn})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#E74732] inline-block" /> Expired Unused ({beforeWastageUnits})
              </span>
            </div>
          </div>
        </div>

        {/* Scenario 2: AFTER PROPOSED REDISTRIBUTION */}
        <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded border border-[#E2DDD5] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2DDD5]">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#142536]">
              Simulated Redistribution Outcome
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E8F5E9] text-[#1D7055] border border-[#A5D6A7]">
              Wastage Prevented
            </span>
          </div>

          <div className="space-y-3 text-xs font-sans">
            <div className="flex justify-between items-center py-1 border-b border-[#F2EFE9]">
              <span className="text-[#5A6E85]">Transfer Quantity Dispatched:</span>
              <span className="font-mono font-bold text-[#142536]">{simulatedQty} units</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#F2EFE9]">
              <span className="text-[#5A6E85]">Donor Remaining Stock:</span>
              <span
                className={`font-mono font-bold ${
                  isDonorSafetyBreached ? 'text-[#E74732]' : 'text-[#1D7055]'
                }`}
              >
                {simulatedDonorPostStock} units (Reserve: {donorSafetyStock})
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#F2EFE9]">
              <span className="text-[#5A6E85]">Recipient Stock Post-Transfer:</span>
              <span className="font-mono font-bold text-[#142536]">
                {simulatedRecipientPostStock} units (Absorbs 100%)
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#F2EFE9]">
              <span className="text-[#5A6E85]">Wastage Saved:</span>
              <span className="font-mono font-bold text-[#1D7055]">
                {simulatedWastageSavedUnits} units (${simulatedWastageSavedValue.toFixed(2)})
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#5A6E85]">Wastage Reduction Efficiency:</span>
              <span className="font-mono font-bold text-[#1D7055] text-sm">
                {simulatedReductionPercent}% Avoided
              </span>
            </div>
          </div>

          {/* Visual Bar representation */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[11px] font-sans text-[#718294]">
              <span>Inventory Fate Post-FEFO</span>
              <span className="text-[#1D7055] font-semibold">{simulatedReductionPercent}% Preserved</span>
            </div>
            <div className="h-3 w-full bg-[#EAE6DF] rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.round((donorLocalBurn / donorPreStock) * 100)}%` }}
                className="bg-[#1D7055] h-full"
                title="Locally Consumed"
              />
              <div
                style={{ width: `${Math.round((simulatedWastageSavedUnits / donorPreStock) * 100)}%` }}
                className="bg-[#2563EB] h-full"
                title="Redistributed & Consumed"
              />
              <div
                style={{ width: `${Math.round((simulatedRemainingWastageUnits / donorPreStock) * 100)}%` }}
                className="bg-[#E74732] h-full"
                title="Remaining Waste"
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#718294]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#1D7055] inline-block" /> Local ({donorLocalBurn})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] inline-block" /> Saved via Transfer ({simulatedWastageSavedUnits})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#E74732] inline-block" /> Residual Loss ({simulatedRemainingWastageUnits})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Action Row */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#718294] font-sans border-t border-[#E2DDD5]">
        <div>
          <em>Notice: Simulation model operates in sandboxed memory and does not mutate real database records until confirmed.</em>
        </div>

        <button
          type="button"
          disabled={isDonorSafetyBreached || simulatedQty <= 0}
          onClick={() => onLaunchConfirmation(currentRec, simulatedQty)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded font-sans font-medium text-xs transition-colors cursor-pointer shadow-xs ${
            isDonorSafetyBreached || simulatedQty <= 0
              ? 'bg-[#EAE6DF] text-[#A6B4C2] cursor-not-allowed'
              : 'bg-[#142536] text-white hover:bg-[#1E344A]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#1D7055]" />
          <span>Proceed with Simulated Allocation ({simulatedQty} units)</span>
        </button>
      </div>
    </div>
  );
};

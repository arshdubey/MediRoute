import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import {
  ShieldCheck,
  ShieldAlert,
  Truck,
  Check,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  Flame,
} from 'lucide-react';

export const MatchDonorModal: React.FC = () => {
  const {
    inspectingMatchItem,
    closeMatchDonorModal,
    matchDonorForRecord,
    acceptRecommendation,
  } = useApp();

  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

  // Evaluate donor candidates for this recipient item
  const evaluation = useMemo(() => {
    if (!inspectingMatchItem) return { recommendation: null, candidates: [] };
    return matchDonorForRecord(inspectingMatchItem);
  }, [inspectingMatchItem, matchDonorForRecord]);

  if (!inspectingMatchItem) return null;

  const { recommendation, candidates } = evaluation;
  const item = inspectingMatchItem;

  // Immediate deficit calculation
  const immediateShortage = Math.max(0, item.minSafetyStock - item.currentStock);

  // Donor safety buffer calculation
  const donorSafetyBuffer = recommendation
    ? Math.max(0, recommendation.donorPostStock - recommendation.donorSafetyStock)
    : 0;

  const handleConfirm = () => {
    if (!recommendation || isConfirming) return;
    setConfirmationError(null);
    setIsConfirming(true);

    // Revalidate safety invariant prior to commit
    if (recommendation.donorPostStock < recommendation.donorSafetyStock) {
      setConfirmationError('Safety invariant violation: Donor post-stock would breach minimum reserve.');
      setIsConfirming(false);
      return;
    }

    const res = acceptRecommendation(recommendation.id);
    if (res.success) {
      setIsConfirming(false);
      closeMatchDonorModal();
    } else {
      setIsConfirming(false);
      setConfirmationError(res.error || 'Failed to confirm transfer.');
    }
  };

  const eligibleCandidates = candidates.filter((c) => c.isEligible);
  const rejectedCandidates = candidates.filter((c) => !c.isEligible);

  return (
    <Modal
      isOpen={inspectingMatchItem !== null}
      onClose={closeMatchDonorModal}
      title={`Inter-Clinic Redistribution Match: ${item.medicine.name}`}
      subtitle={`${item.clinic.name} (${item.clinic.code}) • Formulation: ${item.medicine.dosageForm} • Category: ${item.medicine.category}`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Recipient Facility Deficit Diagnostic Card */}
        <div className="bg-[#2D0D0F]/30 border border-[#BB232B]/40 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF6B72] font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FF6B72]" />
                Recipient In Deficit
              </span>
              <StatusBadge status={item.calc.status} size="sm" />
            </div>
            <h4 className="font-serif text-lg text-white mt-1 font-normal">{item.clinic.name}</h4>
            <p className="text-xs text-[#A0A0AA] font-sans">{item.clinic.address}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-[#171923] px-3.5 py-2 rounded-lg border border-[#2D3142] text-xs shadow-md font-mono">
            <div>
              <span className="text-[10px] text-[#A0A0AA] block font-sans">On-Hand</span>
              <strong className="text-sm font-bold text-[#FF6B72] tabular-nums">
                {item.currentStock} {item.medicine.unit}
              </strong>
            </div>
            <div className="border-l border-[#2D3142] pl-2.5">
              <span className="text-[10px] text-[#A0A0AA] block font-sans">Safety Min</span>
              <strong className="text-sm font-bold text-white tabular-nums">
                {item.minSafetyStock} {item.medicine.unit}
              </strong>
            </div>
            <div className="border-l border-[#2D3142] pl-2.5">
              <span className="text-[10px] text-[#A0A0AA] block font-sans">Runway</span>
              <strong className="text-sm font-bold text-[#FF6B72] tabular-nums">
                {item.calc.daysUntilStockout}d
              </strong>
            </div>
          </div>
        </div>

        {/* Selected Best Transfer Proposition & Prominent Safety Invariants Matrix */}
        {recommendation ? (
          <div className="bg-[#171923] rounded-lg border border-[#2D3142] shadow-xl overflow-hidden">
            {/* Header with High-Contrast Cobalt Bar */}
            <div className="bg-[#2C3480] p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3D479E]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-[#1F2561] border border-white/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[#5AA98C]" />
                </div>
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                    Verified Optimal Transfer Match
                  </h3>
                  <p className="text-xs text-white/80 font-sans">
                    Matches exact formulation with guaranteed donor safety reserve preservation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto bg-[#1F2561] px-3 py-1 rounded border border-white/20 text-xs font-mono font-bold text-white tabular-nums">
                Transfer: {recommendation.recommendedQuantity} {item.medicine.unit}
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Prominent Mathematical Safety Calculation Matrix */}
              <div>
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#2D3142]">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#A0A0AA] font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#5AA98C]" />
                    <span className="text-white">Clinical Safety Calculations &amp; Inventory Projection</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#5AA98C] bg-[#16815D]/20 px-1.5 py-0.5 rounded border border-[#16815D]/40 font-semibold">
                    100% Invariant Preserved
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  {/* Metric 1: Recipient Immediate Deficit */}
                  <div className="bg-[#222431] p-3 rounded-lg border border-[#2D3142]">
                    <span className="text-[10px] font-mono text-[#A0A0AA] uppercase tracking-wider block">
                      1. Recipient Deficit
                    </span>
                    <div className="text-base font-serif font-bold text-[#FF6B72] mt-0.5 tabular-nums">
                      {immediateShortage} {item.medicine.unit}
                    </div>
                    <span className="text-[10px] text-[#A0A0AA] font-sans">
                      Below {item.minSafetyStock} safety threshold
                    </span>
                  </div>

                  {/* Metric 2: Proposed Allocation */}
                  <div className="bg-[#222431] p-3 rounded-lg border border-[#2D3142]">
                    <span className="text-[10px] font-mono text-[#A0A0AA] uppercase tracking-wider block">
                      2. Transfer Quantity
                    </span>
                    <div className="text-base font-serif font-bold text-white mt-0.5 tabular-nums">
                      {recommendation.recommendedQuantity} {item.medicine.unit}
                    </div>
                    <span className="text-[10px] text-[#5AA98C] font-sans font-medium">
                      Deficit + 3d operating buffer
                    </span>
                  </div>

                  {/* Metric 3: Donor Pre-Transfer */}
                  <div className="bg-[#222431] p-3 rounded-lg border border-[#2D3142]">
                    <span className="text-[10px] font-mono text-[#A0A0AA] uppercase tracking-wider block">
                      3. Donor Current Stock
                    </span>
                    <div className="text-base font-serif font-bold text-white mt-0.5 tabular-nums">
                      {recommendation.donorPreStock} {item.medicine.unit}
                    </div>
                    <span className="text-[10px] text-[#A0A0AA] font-sans">
                      Safety reserve: {recommendation.donorSafetyStock} {item.medicine.unit}
                    </span>
                  </div>

                  {/* Metric 4: Projected Donor Stock */}
                  <div className="bg-[#0A2B1D]/40 p-3 rounded-lg border border-[#16815D]/40">
                    <span className="text-[10px] font-mono text-[#5AA98C] uppercase tracking-wider font-bold block">
                      4. Projected Donor Stock
                    </span>
                    <div className="text-base font-serif font-bold text-[#5AA98C] mt-0.5 tabular-nums">
                      {recommendation.donorPostStock} {item.medicine.unit}
                    </div>
                    <span className="text-[10px] text-[#5AA98C] font-sans">
                      Strictly &ge; {recommendation.donorSafetyStock} safety minimum
                    </span>
                  </div>

                  {/* Metric 5: Remaining Donor Buffer */}
                  <div className="bg-[#0A2B1D]/40 p-3 rounded-lg border border-[#16815D]/40">
                    <span className="text-[10px] font-mono text-[#5AA98C] uppercase tracking-wider font-bold block">
                      5. Remaining Buffer
                    </span>
                    <div className="text-base font-serif font-bold text-[#5AA98C] mt-0.5 tabular-nums">
                      +{donorSafetyBuffer} {item.medicine.unit}
                    </div>
                    <span className="text-[10px] text-[#5AA98C] font-sans">
                      Surplus retained above reserve
                    </span>
                  </div>

                  {/* Metric 6: Recipient Projected Stock & Runway */}
                  <div className="bg-[#222431] p-3 rounded-lg border border-[#2D3142]">
                    <span className="text-[10px] font-mono text-[#A0A0AA] uppercase tracking-wider block">
                      6. Recipient Projected
                    </span>
                    <div className="text-base font-serif font-bold text-white mt-0.5 tabular-nums">
                      {recommendation.recipientPostStock} {item.medicine.unit}
                    </div>
                    <span className="text-[10px] text-[#5AA98C] font-sans font-medium">
                      Coverage: ~{recommendation.recipientPostDays}d (from {item.calc.daysUntilStockout}d)
                    </span>
                  </div>
                </div>
              </div>

              {/* Donor Facility Profile & Logistics Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#222431] p-3.5 rounded-lg border border-[#2D3142] text-xs text-[#A0A0AA]">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-sans font-semibold text-white">
                    <Building2 className="w-3.5 h-3.5 text-[#5AA98C]" />
                    <span>Donor: {recommendation.candidatesEvaluated?.find(c => c.clinicId === recommendation.donorClinicId)?.clinicName}</span>
                    <span className="font-mono text-[10px] bg-[#171923] text-white px-1.5 py-0.5 rounded border border-[#2D3142]">
                      {recommendation.candidatesEvaluated?.find(c => c.clinicId === recommendation.donorClinicId)?.clinicCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#A0A0AA] font-sans text-[11px]">
                    <Truck className="w-3 h-3 text-[#A0A0AA]" />
                    <span>Road Distance: <strong className="text-white font-mono">{recommendation.distanceKm} km</strong> (~{recommendation.estimatedTransitMinutes} mins courier)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-sans font-semibold text-white">
                    <Calendar className="w-3.5 h-3.5 text-[#A0A0AA]" />
                    <span>Batch: <strong className="font-mono text-white">{recommendation.batchNumber}</strong></span>
                  </div>
                  <div className="text-[#A0A0AA] font-sans text-[11px]">
                    Shelf-Life: Expires <strong className="text-white font-mono">{recommendation.expiryDate}</strong> (verified &gt; 48h courier threshold)
                  </div>
                </div>
              </div>

              {/* Plain-Language Clinical Rationale & Optimization Explanation */}
              <div className="p-4 rounded-lg bg-[#222431] border border-[#2D3142] text-xs text-white space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5 font-sans">
                  <Sparkles className="w-3.5 h-3.5 text-[#6872C4]" />
                  <span>Clinical Rationale &amp; Buffer Optimization</span>
                </div>
                <p className="leading-relaxed font-sans text-[#A0A0AA]">{recommendation.explanation.summary}</p>
                <p className="text-[#A0A0AA] leading-relaxed font-sans">{recommendation.explanation.donorRationale}</p>

                {recommendation.explanation.quantityRationale && (
                  <div className="mt-2 pt-2 border-t border-[#2D3142] bg-[#171923] p-3 rounded-lg border border-[#2D3142] space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5 text-xs font-sans">
                      <Info className="w-3.5 h-3.5 text-[#A0A0AA] flex-shrink-0" />
                      <span>Transfer Quantity Optimization (Deterministic Buffer)</span>
                    </span>
                    <p className="text-[#A0A0AA] text-xs leading-relaxed font-sans">
                      {recommendation.explanation.quantityRationale}
                    </p>
                  </div>
                )}
              </div>

              {confirmationError && (
                <div className="p-3 bg-[#BB232B]/20 border border-[#BB232B]/50 text-[#FF6B72] rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{confirmationError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2.5">
                <span className="text-[10px] text-[#A0A0AA] italic font-sans">
                  * Confirmation updates stock, recalculates network runways, and records immutable dispatch log.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeMatchDonorModal}
                    className="px-3.5 py-2 text-xs font-medium text-[#A0A0AA] hover:text-white bg-[#222431] hover:bg-[#2D3142] border border-[#2D3142] rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isConfirming}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2C3480] hover:bg-[#232a6b] rounded-lg shadow-md transition-colors cursor-pointer active:scale-95 border border-[#3D479E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480] disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>{isConfirming ? 'Revalidating & Executing...' : 'Confirm & Execute Transfer'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#B87A14]/15 border border-[#B87A14]/40 rounded-lg p-6 text-center">
            <ShieldAlert className="w-8 h-8 text-[#F5CB7A] mx-auto mb-2" />
            <h4 className="font-serif text-base text-white">No Safe Donor Available</h4>
            <p className="text-xs text-[#A0A0AA] max-w-md mx-auto mt-1 leading-relaxed font-sans">
              All other network facilities holding this medicine either lack sufficient surplus above their own safety threshold, or their batches are expired. Under the zero-violation safety policy, no transfer is recommended.
            </p>
          </div>
        )}

        {/* Candidate Facilities Evaluation Matrix: Comparing Safe vs. Refused Facilities */}
        <div className="bg-[#171923] rounded-lg p-4 sm:p-5 border border-[#2D3142] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-white flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#A0A0AA]" />
              <span>Network Candidate Facilities Evaluated ({candidates.length})</span>
            </span>
            <span className="text-[11px] font-sans text-[#A0A0AA]">
              Safety Reserve &amp; Transit Invariants Enforced
            </span>
          </div>

          <div className="space-y-2">
            {candidates.map((cand) => {
              const isSelected = cand.clinicId === recommendation?.donorClinicId;

              return (
                <div
                  key={cand.clinicId}
                  className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-[#0A2B1D]/40 border-[#16815D] ring-1 ring-[#16815D]/40 shadow-sm'
                      : cand.isEligible
                      ? 'bg-[#222431] border-[#2D3142] hover:border-[#2C3480]'
                      : 'bg-[#222431]/60 border-[#2D3142]/60 opacity-80'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-sm text-white">{cand.clinicName}</span>
                      <span className="text-[11px] font-mono text-[#A0A0AA] bg-[#171923] px-1.5 py-0.5 rounded border border-[#2D3142]">
                        ({cand.clinicCode})
                      </span>
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#16815D]/20 text-[#5AA98C] border border-[#16815D]/40">
                          <CheckCircle2 className="w-3 h-3 text-[#5AA98C]" />
                          Recommended Donor
                        </span>
                      ) : cand.isEligible ? (
                        <span className="text-[10px] font-mono text-[#5AA98C] font-semibold">
                          Eligible Alternative
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-[#FF6B72] bg-[#BB232B]/20 px-2 py-0.5 rounded border border-[#BB232B]/40">
                          Refused by Invariant
                        </span>
                      )}
                    </div>

                    <div className="mt-1 text-xs font-sans">
                      {cand.isEligible ? (
                        <span className="text-[#5AA98C] font-medium">
                          Surplus of {cand.availableSurplus} {item.medicine.unit} safely available above {cand.safetyStock} reserve.
                          {cand.projectedPostStock !== undefined && ` Post-transfer stock: ${cand.projectedPostStock} units.`}
                        </span>
                      ) : (
                        <span className="text-[#FF6B72] font-medium">
                          Refusal Reason: {cand.rejectionReason}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono flex-shrink-0 tabular-nums text-[#A0A0AA] flex-wrap sm:flex-nowrap">
                    <div>
                      <span className="text-[10px] text-[#A0A0AA] block font-sans">Stock / Min</span>
                      <strong className="text-white">{cand.currentStock}</strong> / {cand.safetyStock}
                    </div>
                    <div className="border-l border-[#2D3142] pl-2.5">
                      <span className="text-[10px] text-[#A0A0AA] block font-sans">Surplus</span>
                      <strong className={cand.availableSurplus > 0 ? 'text-[#5AA98C] font-bold' : 'text-[#A0A0AA]'}>
                        {cand.availableSurplus}
                      </strong>
                    </div>
                    {cand.avgDailyConsumption !== undefined && (
                      <div className="border-l border-[#2D3142] pl-2.5">
                        <span className="text-[10px] text-[#A0A0AA] block font-sans">Burn</span>
                        <strong className="text-white">{cand.avgDailyConsumption}/d</strong>
                      </div>
                    )}
                    <div className="border-l border-[#2D3142] pl-2.5">
                      <span className="text-[10px] text-[#A0A0AA] block font-sans">Distance</span>
                      <strong className="text-white">{cand.distanceKm} km</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
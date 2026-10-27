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
        <div className="bg-[#FDF3F1] border border-[#F6CCC5] rounded p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#CB3520] font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-[#E74732]" />
                Recipient In Deficit
              </span>
              <StatusBadge status={item.calc.status} size="sm" />
            </div>
            <h4 className="font-serif text-lg text-[#142536] mt-1 font-normal">{item.clinic.name}</h4>
            <p className="text-xs text-[#77766F] font-sans">{item.clinic.address}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-white px-3.5 py-2 rounded border border-[#F6CCC5] text-xs shadow-xs font-mono">
            <div>
              <span className="text-[10px] text-[#77766F] block font-sans">On-Hand</span>
              <strong className="text-sm font-bold text-[#E74732] tabular-nums">
                {item.currentStock} {item.medicine.unit}
              </strong>
            </div>
            <div className="border-l border-[#E5E3DC] pl-2.5">
              <span className="text-[10px] text-muted block font-sans">Safety Min</span>
              <strong className="text-sm font-bold text-[#142536] tabular-nums">
                {item.minSafetyStock} {item.medicine.unit}
              </strong>
            </div>
            <div className="border-l border-[#E5E3DC] pl-2.5">
              <span className="text-[10px] text-muted block font-sans">Runway</span>
              <strong className="text-sm font-bold text-[#E74732] tabular-nums">
                {item.calc.daysUntilStockout}d
              </strong>
            </div>
          </div>
        </div>

        {/* Selected Best Transfer Proposition & Prominent Safety Invariants Matrix */}
        {recommendation ? (
          <div className="bg-white rounded border border-concrete shadow-xs overflow-hidden">
            {/* Header with High-Contrast Dark Bar */}
            <div className="bg-[#142536] p-4 sm:p-5 text-[#F7F5F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#253D54]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-[#1D3145] border border-[#2B435C] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[#1D7055]" />
                </div>
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-[#F7F5F0]">
                    Verified Optimal Transfer Match
                  </h3>
                  <p className="text-xs text-[#C5D0DC] font-sans">
                    Matches exact formulation with guaranteed donor safety reserve preservation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto bg-[#1D3145] px-3 py-1 rounded border border-[#2B435C] text-xs font-mono font-bold text-[#F7F5F0] tabular-nums">
                Transfer: {recommendation.recommendedQuantity} {item.medicine.unit}
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Prominent Mathematical Safety Calculation Matrix (Requirement 4) */}
              <div>
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-concrete">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-clinicalGreen" />
                    <span>Clinical Safety Calculations &amp; Inventory Projection</span>
                  </span>
                  <span className="text-[10px] font-mono text-clinicalGreen bg-clinicalGreen/10 px-1.5 py-0.5 rounded border border-clinicalGreen/30 font-semibold">
                    100% Invariant Preserved
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  {/* Metric 1: Recipient Immediate Deficit */}
                  <div className="bg-paper p-3 rounded border border-concrete">
                    <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                      1. Recipient Deficit
                    </span>
                    <div className="text-base font-serif font-bold text-vermilion mt-0.5 tabular-nums">
                      {immediateShortage} {item.medicine.unit}
                    </div>
                    <span className="text-[10px] text-graphite font-sans">
                      Below {item.minSafetyStock} safety threshold
                    </span>
                  </div>

                  {/* Metric 2: Proposed Allocation */}
                  <div className="bg-paper p-3 rounded border border-concrete">
                    <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                      2. Transfer Quantity
                    </span>
                    <div className="text-base font-serif font-bold text-ink mt-0.5 tabular-nums">
                      {recommendation.recommendedQuantity} {item.medicine.unit}
                    </div>
                    <span className="text-[10px] text-clinicalGreen font-sans font-medium">
                      Deficit + 3d operating buffer
                    </span>
                  </div>

                  {/* Metric 3: Donor Pre-Transfer */}
                  <div className="bg-paper p-3 rounded border border-concrete">
                    <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                      3. Donor Current Stock
                    </span>
                    <div className="text-base font-serif font-bold text-ink mt-0.5 tabular-nums">
                      {recommendation.donorPreStock} {item.medicine.unit}
                    </div>
                    <span className="text-[10px] text-graphite font-sans">
                      Safety reserve: {recommendation.donorSafetyStock} {item.medicine.unit}
                    </span>
                  </div>

                  {/* Metric 4: Projected Donor Stock */}
                  <div className="bg-clinicalGreen/5 p-3 rounded border border-clinicalGreen/30">
                    <span className="text-[10px] font-mono text-clinicalGreen uppercase tracking-wider font-bold block">
                      4. Projected Donor Stock
                    </span>
                    <div className="text-base font-serif font-bold text-clinicalGreen mt-0.5 tabular-nums">
                      {recommendation.donorPostStock} {item.medicine.unit}
                    </div>
                    <span className="text-[10px] text-clinicalGreen font-sans">
                      Strictly &ge; {recommendation.donorSafetyStock} safety minimum
                    </span>
                  </div>

                  {/* Metric 5: Remaining Donor Buffer */}
                  <div className="bg-clinicalGreen/5 p-3 rounded border border-clinicalGreen/30">
                    <span className="text-[10px] font-mono text-clinicalGreen uppercase tracking-wider font-bold block">
                      5. Remaining Buffer
                    </span>
                    <div className="text-base font-serif font-bold text-clinicalGreen mt-0.5 tabular-nums">
                      +{donorSafetyBuffer} {item.medicine.unit}
                    </div>
                    <span className="text-[10px] text-clinicalGreen font-sans">
                      Surplus retained above reserve
                    </span>
                  </div>

                  {/* Metric 6: Recipient Projected Stock & Runway */}
                  <div className="bg-paper p-3 rounded border border-concrete">
                    <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                      6. Recipient Projected
                    </span>
                    <div className="text-base font-serif font-bold text-ink mt-0.5 tabular-nums">
                      {recommendation.recipientPostStock} {item.medicine.unit}
                    </div>
                    <span className="text-[10px] text-clinicalGreen font-sans font-medium">
                      Coverage: ~{recommendation.recipientPostDays}d (from {item.calc.daysUntilStockout}d)
                    </span>
                  </div>
                </div>
              </div>

              {/* Donor Facility Profile & Logistics Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-paper p-3.5 rounded border border-concrete text-xs text-graphite">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-sans font-semibold text-ink">
                    <Building2 className="w-3.5 h-3.5 text-clinicalGreen" />
                    <span>Donor: {recommendation.candidatesEvaluated?.find(c => c.clinicId === recommendation.donorClinicId)?.clinicName}</span>
                    <span className="font-mono text-[10px] bg-white px-1.5 py-0.2 rounded border border-concrete">
                      {recommendation.candidatesEvaluated?.find(c => c.clinicId === recommendation.donorClinicId)?.clinicCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted font-sans text-[11px]">
                    <Truck className="w-3 h-3 text-muted" />
                    <span>Road Distance: <strong className="text-ink font-mono">{recommendation.distanceKm} km</strong> (~{recommendation.estimatedTransitMinutes} mins courier)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-sans font-semibold text-ink">
                    <Calendar className="w-3.5 h-3.5 text-muted" />
                    <span>Batch: <strong className="font-mono text-ink">{recommendation.batchNumber}</strong></span>
                  </div>
                  <div className="text-muted font-sans text-[11px]">
                    Shelf-Life: Expires <strong className="text-ink font-mono">{recommendation.expiryDate}</strong> (verified &gt; 48h courier threshold)
                  </div>
                </div>
              </div>

              {/* Plain-Language Clinical Rationale & Optimization Explanation */}
              <div className="p-4 rounded bg-paper border border-concrete text-xs text-ink space-y-2">
                <div className="font-bold text-ink flex items-center gap-1.5 font-sans">
                  <Sparkles className="w-3.5 h-3.5 text-vermilion" />
                  <span>Clinical Rationale &amp; Buffer Optimization</span>
                </div>
                <p className="leading-relaxed font-sans text-graphite">{recommendation.explanation.summary}</p>
                <p className="text-muted leading-relaxed font-sans">{recommendation.explanation.donorRationale}</p>

                {recommendation.explanation.quantityRationale && (
                  <div className="mt-2 pt-2 border-t border-concrete bg-white p-3 rounded border border-concrete space-y-1">
                    <span className="font-bold text-ink flex items-center gap-1.5 text-xs font-sans">
                      <Info className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                      <span>Transfer Quantity Optimization (Deterministic Buffer)</span>
                    </span>
                    <p className="text-graphite text-xs leading-relaxed font-sans">
                      {recommendation.explanation.quantityRationale}
                    </p>
                  </div>
                )}
              </div>

              {confirmationError && (
                <div className="p-3 bg-vermilion/10 border border-vermilion/30 text-vermilion rounded text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{confirmationError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2.5">
                <span className="text-[10px] text-muted italic font-sans">
                  * Confirmation updates stock, recalculates network runways, and records immutable dispatch log.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeMatchDonorModal}
                    className="px-3.5 py-2 text-xs font-medium text-graphite hover:text-ink bg-white hover:bg-concrete/40 border border-concrete rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isConfirming}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-ink hover:bg-black rounded shadow-xs transition-colors cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>{isConfirming ? 'Revalidating & Executing...' : 'Confirm & Execute Transfer'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded p-6 text-center">
            <ShieldAlert className="w-8 h-8 text-clinicalAmber mx-auto mb-2" />
            <h4 className="font-serif text-base text-ink">No Safe Donor Available</h4>
            <p className="text-xs text-graphite max-w-md mx-auto mt-1 leading-relaxed font-sans">
              All other network facilities holding this medicine either lack sufficient surplus above their own safety threshold, or their batches are expired. Under the zero-violation safety policy, no transfer is recommended.
            </p>
          </div>
        )}

        {/* Candidate Facilities Evaluation Matrix: Comparing Safe vs. Refused Facilities (Requirements 3 & 4) */}
        <div className="bg-paper rounded p-4 sm:p-5 border border-concrete space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-ink flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-muted" />
              <span>Network Candidate Facilities Evaluated ({candidates.length})</span>
            </span>
            <span className="text-[11px] font-sans text-muted">
              Safety Reserve &amp; Transit Invariants Enforced
            </span>
          </div>

          <div className="space-y-2">
            {candidates.map((cand) => {
              const isSelected = cand.clinicId === recommendation?.donorClinicId;

              return (
                <div
                  key={cand.clinicId}
                  className={`p-3 rounded border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-white border-clinicalGreen ring-1 ring-clinicalGreen/30 shadow-xs'
                      : cand.isEligible
                      ? 'bg-white border-concrete hover:border-ink'
                      : 'bg-white/80 border-concrete/80 opacity-90'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-sm text-ink">{cand.clinicName}</span>
                      <span className="text-[11px] font-mono text-muted bg-paper px-1.5 py-0.5 rounded border border-concrete">
                        ({cand.clinicCode})
                      </span>
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-clinicalGreen/10 text-clinicalGreen border border-clinicalGreen/30">
                          <CheckCircle2 className="w-3 h-3 text-clinicalGreen" />
                          Recommended Donor
                        </span>
                      ) : cand.isEligible ? (
                        <span className="text-[10px] font-mono text-clinicalGreen font-semibold">
                          Eligible Alternative
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-vermilion bg-vermilion/10 px-2 py-0.5 rounded border border-vermilion/20">
                          Refused by Invariant
                        </span>
                      )}
                    </div>

                    <div className="mt-1 text-xs font-sans">
                      {cand.isEligible ? (
                        <span className="text-clinicalGreen font-medium">
                          Surplus of {cand.availableSurplus} {item.medicine.unit} safely available above {cand.safetyStock} reserve.
                          {cand.projectedPostStock !== undefined && ` Post-transfer stock: ${cand.projectedPostStock} units.`}
                        </span>
                      ) : (
                        <span className="text-vermilion font-medium">
                          Refusal Reason: {cand.rejectionReason}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono flex-shrink-0 tabular-nums text-graphite flex-wrap sm:flex-nowrap">
                    <div>
                      <span className="text-[10px] text-muted block font-sans">Stock / Min</span>
                      <strong className="text-ink">{cand.currentStock}</strong> / {cand.safetyStock}
                    </div>
                    <div className="border-l border-concrete pl-2.5">
                      <span className="text-[10px] text-muted block font-sans">Surplus</span>
                      <strong className={cand.availableSurplus > 0 ? 'text-clinicalGreen font-bold' : 'text-muted'}>
                        {cand.availableSurplus}
                      </strong>
                    </div>
                    {cand.avgDailyConsumption !== undefined && (
                      <div className="border-l border-concrete pl-2.5">
                        <span className="text-[10px] text-muted block font-sans">Burn</span>
                        <strong className="text-ink">{cand.avgDailyConsumption}/d</strong>
                      </div>
                    )}
                    <div className="border-l border-concrete pl-2.5">
                      <span className="text-[10px] text-muted block font-sans">Distance</span>
                      <strong className="text-ink">{cand.distanceKm} km</strong>
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
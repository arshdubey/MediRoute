import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sliders,
  DollarSign,
  TrendingDown,
} from 'lucide-react';
import { FEFORedistributionRecommendation } from '../../services/fefoEngine';

interface FEFORecommendationsListProps {
  recommendations: FEFORedistributionRecommendation[];
  onOpenConfirmModal: (rec: FEFORedistributionRecommendation) => void;
  onOpenSimulator: (rec: FEFORedistributionRecommendation) => void;
}

export const FEFORecommendationsList: React.FC<FEFORecommendationsListProps> = ({
  recommendations,
  onOpenConfirmModal,
  onOpenSimulator,
}) => {
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRecId((prev) => (prev === id ? null : id));
  };

  if (recommendations.length === 0) {
    return (
      <div className="bg-[#FFFFFF] rounded border border-[#E2DDD5] p-6 text-center space-y-2">
        <ShieldCheck className="w-8 h-8 text-[#1D7055] mx-auto" />
        <h4 className="font-serif text-base text-[#142536]">All Expiring Batches Protected</h4>
        <p className="text-xs text-[#718294] font-sans max-w-md mx-auto">
          No critical expiry surpluses currently require redistribution, or all eligible transfers have already been confirmed in this session.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E2DDD5]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-xl sm:text-2xl text-[#142536] font-normal tracking-tight">
              Recommended Expiry-Safe Transfers
            </h3>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#142536] text-[#F7F5F0]">
              {recommendations.length} Active {recommendations.length === 1 ? 'Proposal' : 'Proposals'}
            </span>
          </div>
          <p className="text-xs text-[#718294] font-sans mt-0.5">
            Ranked by First-Expiry-First-Out (FEFO) scoring, recipient absorption feasibility, and logistics proximity.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-sans text-[#1D7055] bg-[#E8F5E9] px-2.5 py-1 rounded border border-[#A5D6A7]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Donor Safety Reserve Guaranteed</span>
        </div>
      </div>

      {/* Recommendations Cards */}
      <div className="space-y-3.5">
        {recommendations.map((rec) => {
          const isExpanded = expandedRecId === rec.id;
          const isConfirmed = rec.status === 'ACCEPTED';
          const rejectedCandidates = rec.candidatesEvaluated.filter((c) => !c.isEligible);

          return (
            <div
              key={rec.id}
              className={`bg-[#FFFFFF] rounded border transition-all ${
                isConfirmed
                  ? 'border-[#A5D6A7] bg-[#F9FDF9]'
                  : 'border-[#E2DDD5] hover:border-[#142536] shadow-xs'
              }`}
            >
              {/* Card Header & Route Summary */}
              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Medicine and Urgency */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg text-[#142536] font-normal">
                        {rec.medicineName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F7F5F0] border border-[#E2DDD5] text-[#5A6E85]">
                        {rec.dosageForm}
                      </span>
                      {rec.urgency === 'CRITICAL' ? (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#FDF3F1] text-[#E74732] border border-[#E74732]">
                          CRITICAL PRIORITY
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#FFF9F2] text-[#D97706] border border-[#F59E0B]">
                          HIGH PRIORITY
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#718294] font-mono flex items-center gap-2">
                      <span>Batch #{rec.batchNumber}</span>
                      <span>•</span>
                      <span>Expires in {rec.daysToExpiry} days ({rec.expiryDate})</span>
                      <span>•</span>
                      <span>${rec.standardUnitCost.toFixed(2)}/unit</span>
                    </div>
                  </div>

                  {/* Transfer Quantity & Value Avoided Badge */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-[#718294] uppercase tracking-wider block font-sans">
                        Safe Transfer Quantity
                      </span>
                      <span className="text-xl font-mono font-bold text-[#142536]">
                        {rec.recommendedQuantity} units
                      </span>
                    </div>
                    <div className="h-8 w-px bg-[#E2DDD5]" />
                    <div className="text-right">
                      <span className="text-[10px] text-[#1D7055] uppercase tracking-wider block font-sans font-semibold">
                        Wastage Avoided
                      </span>
                      <span className="text-xl font-mono font-bold text-[#1D7055]">
                        ${rec.estimatedWastageValueSaved.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Facilities Flow Diagram Row */}
                <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5 items-center bg-[#F7F5F0] p-3 rounded border border-[#EBE7DF]">
                  {/* Source Facility (Donor) */}
                  <div className="md:col-span-3 space-y-1">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-[10px] font-mono uppercase text-[#718294]">Donor Facility</span>
                      <span className="font-semibold text-[#142536]">{rec.donorClinicCode}</span>
                    </div>
                    <div className="text-xs font-sans text-[#142536] font-medium truncate">
                      {rec.donorClinicName}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#5A6E85] pt-1 border-t border-[#E2DDD5]">
                      <span>Stock: {rec.donorAvailableStock} &rarr; <strong>{rec.donorPostStock}</strong></span>
                      <span className="text-[#1D7055]">Reserve: {rec.donorSafetyStock} (Safe)</span>
                    </div>
                  </div>

                  {/* Center Transit Arrow */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center py-1">
                    <div className="text-[10px] font-mono text-[#718294]">
                      {rec.distanceKm} km
                    </div>
                    <div className="w-full flex items-center justify-center my-0.5">
                      <div className="h-0.5 w-full bg-[#142536] relative">
                        <ArrowRight className="w-3.5 h-3.5 text-[#142536] absolute -right-1 -top-1.5" />
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-[#718294]">
                      ~{rec.estimatedTransitMinutes}m transit
                    </div>
                  </div>

                  {/* Destination Facility (Recipient) */}
                  <div className="md:col-span-3 space-y-1">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-[10px] font-mono uppercase text-[#718294]">Recipient Facility</span>
                      <span className="font-semibold text-[#142536]">{rec.recipientClinicCode}</span>
                    </div>
                    <div className="text-xs font-sans text-[#142536] font-medium truncate">
                      {rec.recipientClinicName}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#5A6E85] pt-1 border-t border-[#E2DDD5]">
                      <span>Stock: {rec.recipientPreStock} &rarr; <strong>{rec.recipientPostStock}</strong></span>
                      <span className="text-[#142536]">Runway: {rec.recipientPreDays}d &rarr; {rec.recipientPostDays}d</span>
                    </div>
                  </div>
                </div>

                {/* Explanation Summary */}
                <div className="text-xs text-[#2C3E50] font-sans leading-relaxed bg-[#FFFFFF] p-3 rounded border border-[#EAE6DF]">
                  <span className="font-semibold text-[#142536]">Clinical Rationale: </span>
                  {rec.rationale.summary}
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(rec.id)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#5A6E85] hover:text-[#142536] font-sans cursor-pointer"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Hide Constraint Analysis & Refused Facilities</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>Inspect Constraint Analysis ({rejectedCandidates.length} Facilities Refused)</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenSimulator(rec)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-sans text-[#142536] bg-[#F7F5F0] hover:bg-[#EAE6DF] border border-[#D5CFBF] transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#5A6E85]" />
                      <span>Simulate Wastage Model</span>
                    </button>

                    {isConfirmed ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-sans font-medium text-[#1D7055] bg-[#E8F5E9] border border-[#A5D6A7]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Dispatched in Session</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenConfirmModal(rec)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-sans font-medium text-white bg-[#142536] hover:bg-[#1E344A] transition-colors cursor-pointer shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1D7055]" />
                        <span>Review & Confirm Transfer</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible Detailed Constraint & Refusal Panel */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-3 border-t border-[#EAE6DF] bg-[#FAF8F5] space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                    <div className="bg-[#FFFFFF] p-3 rounded border border-[#E2DDD5] space-y-1">
                      <span className="font-semibold text-[#142536] block">1. Local Expiry Feasibility Breakdown</span>
                      <p className="text-[#5A6E85] leading-relaxed">
                        {rec.rationale.expiryAnalysis}
                      </p>
                    </div>

                    <div className="bg-[#FFFFFF] p-3 rounded border border-[#E2DDD5] space-y-1">
                      <span className="font-semibold text-[#142536] block">2. Recipient Consumption Feasibility</span>
                      <p className="text-[#5A6E85] leading-relaxed">
                        {rec.rationale.recipientCapacity}
                      </p>
                    </div>
                  </div>

                  {/* Refused Candidate Facilities Table */}
                  <div className="bg-[#FFFFFF] rounded border border-[#E2DDD5] overflow-hidden">
                    <div className="px-3.5 py-2 bg-[#F2EFE9] border-b border-[#E2DDD5] text-xs font-semibold text-[#142536]">
                      Candidate Facilities Refused by FEFO Constraint Engine
                    </div>
                    <div className="divide-y divide-[#EAE6DF] text-xs font-sans">
                      {rejectedCandidates.length === 0 ? (
                        <div className="p-3 text-[#718294] text-center">
                          No other facilities possess matching formulary records.
                        </div>
                      ) : (
                        rejectedCandidates.map((c) => (
                          <div key={c.recipientClinicId} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="font-medium text-[#142536]">
                                {c.recipientClinicCode} - {c.recipientClinicName}
                              </span>
                              <div className="text-[11px] text-[#718294] font-mono">
                                Stock: {c.currentStock} units | Burn: {c.avgDailyConsumption}/d | Usable Capacity: ~{c.recipientProjectedUsageBeforeExpiry} units
                              </div>
                            </div>

                            <span className="text-[11px] text-[#8C3A2F] bg-[#FDF3F1] px-2 py-1 rounded border border-[#FCA5A5] self-start sm:self-auto">
                              {c.rejectionReason}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

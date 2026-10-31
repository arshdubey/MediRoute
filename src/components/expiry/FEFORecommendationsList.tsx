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
      <div className="bg-[#171923] rounded-lg border border-[#2D3142] p-6 text-center space-y-2">
        <ShieldCheck className="w-8 h-8 text-[#5AA98C] mx-auto" />
        <h4 className="font-serif text-base text-white">All Expiring Batches Protected</h4>
        <p className="text-xs text-[#A0A0AA] font-sans max-w-md mx-auto">
          No critical expiry surpluses currently require redistribution, or all eligible transfers have already been confirmed in this session.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#2D3142]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-xl sm:text-2xl text-white font-normal tracking-tight">
              Recommended Expiry-Safe Transfers
            </h3>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-lg bg-[#2C3480] text-white">
              {recommendations.length} Active {recommendations.length === 1 ? 'Proposal' : 'Proposals'}
            </span>
          </div>
          <p className="text-xs text-[#A0A0AA] font-sans mt-0.5">
            Ranked by First-Expiry-First-Out (FEFO) scoring, recipient absorption feasibility, and logistics proximity.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-sans text-[#5AA98C] bg-[#16815D]/20 px-2.5 py-1 rounded-lg border border-[#16815D]/40">
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
              className={`rounded-lg border transition-all ${
                isConfirmed
                  ? 'border-[#16815D] bg-[#16815D]/15'
                  : 'bg-[#171923] border-[#2D3142] hover:border-[#2C3480]/60 shadow-sm'
              }`}
            >
              {/* Card Header & Route Summary */}
              <div className="p-4 sm:p-5 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Medicine and Urgency */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg text-white font-normal">
                        {rec.medicineName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#222431] border border-[#2D3142] text-[#A0A0AA]">
                        {rec.dosageForm}
                      </span>
                      {rec.urgency === 'CRITICAL' ? (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-lg bg-[#BB232B]/20 text-[#FF6B72] border border-[#BB232B]/40">
                          CRITICAL PRIORITY
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-lg bg-[#D98A1A]/20 text-[#F5A623] border border-[#D98A1A]/40">
                          HIGH PRIORITY
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#A0A0AA] font-mono flex items-center gap-2">
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
                      <span className="text-[10px] text-[#A0A0AA] uppercase tracking-wider block font-sans">
                        Safe Transfer Quantity
                      </span>
                      <span className="text-xl font-mono font-bold text-white">
                        {rec.recommendedQuantity} units
                      </span>
                    </div>
                    <div className="h-8 w-px bg-[#2D3142]" />
                    <div className="text-right">
                      <span className="text-[10px] text-[#5AA98C] uppercase tracking-wider block font-sans font-semibold">
                        Wastage Avoided
                      </span>
                      <span className="text-xl font-mono font-bold text-[#5AA98C]">
                        ${rec.estimatedWastageValueSaved.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Facilities Flow Diagram Row */}
                <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5 items-center bg-[#222431] p-3 rounded-lg border border-[#2D3142]">
                  {/* Source Facility (Donor) */}
                  <div className="md:col-span-3 space-y-1">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-[10px] font-mono uppercase text-[#A0A0AA]">Donor Facility</span>
                      <span className="font-semibold text-white">{rec.donorClinicCode}</span>
                    </div>
                    <div className="text-xs font-sans text-white font-medium truncate">
                      {rec.donorClinicName}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#A0A0AA] pt-1 border-t border-[#2D3142]">
                      <span>Stock: {rec.donorAvailableStock} &rarr; <strong className="text-white">{rec.donorPostStock}</strong></span>
                      <span className="text-[#5AA98C]">Reserve: {rec.donorSafetyStock} (Safe)</span>
                    </div>
                  </div>

                  {/* Center Transit Arrow */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center py-1">
                    <div className="text-[10px] font-mono text-[#A0A0AA]">
                      {rec.distanceKm} km
                    </div>
                    <div className="w-full flex items-center justify-center my-0.5">
                      <div className="h-0.5 w-full bg-[#2C3480] relative">
                        <ArrowRight className="w-3.5 h-3.5 text-blue-400 absolute -right-1 -top-1.5" />
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-[#A0A0AA]">
                      ~{rec.estimatedTransitMinutes}m transit
                    </div>
                  </div>

                  {/* Destination Facility (Recipient) */}
                  <div className="md:col-span-3 space-y-1">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-[10px] font-mono uppercase text-[#A0A0AA]">Recipient Facility</span>
                      <span className="font-semibold text-white">{rec.recipientClinicCode}</span>
                    </div>
                    <div className="text-xs font-sans text-white font-medium truncate">
                      {rec.recipientClinicName}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#A0A0AA] pt-1 border-t border-[#2D3142]">
                      <span>Stock: {rec.recipientPreStock} &rarr; <strong className="text-white">{rec.recipientPostStock}</strong></span>
                      <span className="text-white">Runway: {rec.recipientPreDays}d &rarr; {rec.recipientPostDays}d</span>
                    </div>
                  </div>
                </div>

                {/* Explanation Summary */}
                <div className="text-xs text-[#A0A0AA] font-sans leading-relaxed bg-[#222431] p-3 rounded-lg border border-[#2D3142]">
                  <span className="font-semibold text-white">Clinical Rationale: </span>
                  {rec.rationale.summary}
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(rec.id)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#A0A0AA] hover:text-white font-sans cursor-pointer"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Hide Constraint Analysis &amp; Refused Facilities</span>
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans text-white bg-[#222431] hover:bg-[#2D3142] border border-[#2D3142] transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-blue-400" />
                      <span>Simulate Wastage Model</span>
                    </button>

                    {isConfirmed ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-sans font-medium text-[#5AA98C] bg-[#16815D]/20 border border-[#16815D]/40">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Dispatched in Session</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenConfirmModal(rec)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-sans font-medium text-white bg-[#2C3480] hover:bg-[#232a6b] transition-colors cursor-pointer shadow-md"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#5AA98C]" />
                        <span>Review &amp; Confirm Transfer</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible Detailed Constraint & Refusal Panel */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-3 border-t border-[#2D3142] bg-[#11131a] space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                    <div className="bg-[#171923] p-3 rounded-lg border border-[#2D3142] space-y-1">
                      <span className="font-semibold text-white block">1. Local Expiry Feasibility Breakdown</span>
                      <p className="text-[#A0A0AA] leading-relaxed">
                        {rec.rationale.expiryAnalysis}
                      </p>
                    </div>

                    <div className="bg-[#171923] p-3 rounded-lg border border-[#2D3142] space-y-1">
                      <span className="font-semibold text-white block">2. Recipient Consumption Feasibility</span>
                      <p className="text-[#A0A0AA] leading-relaxed">
                        {rec.rationale.recipientCapacity}
                      </p>
                    </div>
                  </div>

                  {/* Refused Candidate Facilities Table */}
                  <div className="bg-[#171923] rounded-lg border border-[#2D3142] overflow-hidden">
                    <div className="px-3.5 py-2 bg-[#222431] border-b border-[#2D3142] text-xs font-semibold text-white">
                      Candidate Facilities Refused by FEFO Constraint Engine
                    </div>
                    <div className="divide-y divide-[#2D3142] text-xs font-sans">
                      {rejectedCandidates.length === 0 ? (
                        <div className="p-3 text-[#A0A0AA] text-center">
                          No other facilities possess matching formulary records.
                        </div>
                      ) : (
                        rejectedCandidates.map((c) => (
                          <div key={c.recipientClinicId} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="font-medium text-white">
                                {c.recipientClinicCode} - {c.recipientClinicName}
                              </span>
                              <div className="text-[11px] text-[#A0A0AA] font-mono">
                                Stock: {c.currentStock} units | Burn: {c.avgDailyConsumption}/d | Usable Capacity: ~{c.recipientProjectedUsageBeforeExpiry} units
                              </div>
                            </div>

                            <span className="text-[11px] text-[#FF6B72] bg-[#BB232B]/20 px-2 py-1 rounded-lg border border-[#BB232B]/40 self-start sm:self-auto font-medium">
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

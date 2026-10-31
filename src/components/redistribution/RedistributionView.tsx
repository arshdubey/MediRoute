import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { SafeTransferModal } from './SafeTransferModal';
import { RedistributionWalkthrough } from './RedistributionWalkthrough';
import { Reveal, StaggerGroup } from '../motion';
import { RedistributionRecommendation } from '../../types';
import {
  ArrowLeftRight,
  ShieldCheck,
  Check,
  X,
  Truck,
  Building2,
  RefreshCw,
  Plus,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const RedistributionView: React.FC = () => {
  const {
    clinics,
    medicines,
    activeRecommendations,
    acceptRecommendation,
    rejectRecommendation,
    refreshRecommendations,
  } = useApp();

  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [expandedExplanationId, setExpandedExplanationId] = useState<string | null>(null);
  const [walkthroughRec, setWalkthroughRec] = useState<RedistributionRecommendation | null>(null);

  const filteredRecommendations = useMemo(() => {
    if (selectedFilter === 'ALL') return activeRecommendations;
    return activeRecommendations.filter((r) => r.urgency === selectedFilter);
  }, [activeRecommendations, selectedFilter]);

  const stats = useMemo(() => {
    let critical = 0;
    let high = 0;
    let medium = 0;

    for (const r of activeRecommendations) {
      if (r.urgency === 'CRITICAL') critical++;
      else if (r.urgency === 'HIGH') high++;
      else medium++;
    }

    return { total: activeRecommendations.length, critical, high, medium };
  }, [activeRecommendations]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <Reveal direction="up" duration={400}>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#2D3142]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6872C4] inline-block shadow-[0_0_8px_#6872C4]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A0A0AA] font-medium">
                Section 03 • Inter-Facility Redistribution
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-white tracking-tight font-normal">
              Redistribution Proposals
            </h1>
            <p className="text-xs sm:text-sm text-[#A0A0AA] mt-1 max-w-2xl font-sans leading-relaxed">
              Deterministic surplus-to-deficit pairings calculated to eliminate stockouts while maintaining full safety reserves at donor clinics.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {activeRecommendations.length > 0 && !walkthroughRec && (
              <button
                onClick={() => setWalkthroughRec(activeRecommendations[0])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#A4AADE] bg-[#222431] hover:bg-[#2D3142] border border-[#2D3142] rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480]"
                title="Launch guided interactive audit of top proposal"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#6872C4]" />
                <span>Guided Walkthrough</span>
              </button>
            )}

            <button
              onClick={refreshRecommendations}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#A0A0AA] hover:text-white bg-[#222431] hover:bg-[#2D3142] border border-[#2D3142] rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480]"
              title="Recalculate matches"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#A0A0AA]" />
              <span>Recalculate</span>
            </button>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#2C3480] hover:bg-[#232a6b] border border-[#3D479E] rounded-lg transition-colors cursor-pointer shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480]"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Custom Transfer</span>
            </button>
          </div>
        </div>
      </Reveal>

      {/* Interactive Walkthrough Modal / Inline Panel if Active */}
      {walkthroughRec && (
        <Reveal direction="down" duration={350}>
          <RedistributionWalkthrough
            recommendation={walkthroughRec}
            onClose={() => setWalkthroughRec(null)}
            onConfirm={(id) => {
              acceptRecommendation(id);
            }}
            clinics={clinics}
            medicines={medicines}
          />
        </Reveal>
      )}

      {/* Safety Invariant Guarantee Card */}
      <Reveal direction="up" delay={60}>
        <div className="bg-[#171923] rounded-lg border border-[#2D3142] p-5 sm:p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#222431] border border-[#2D3142] flex items-center justify-center flex-shrink-0 text-[#16815D] mt-0.5">
              <ShieldCheck className="w-4 h-4 text-[#5AA98C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-mono uppercase tracking-wider text-white font-bold">
                  Mathematical Safety Invariant Guaranteed
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#16815D]/20 text-[#5AA98C] border border-[#16815D]/50 font-semibold">
                  100% Invariant Adherence
                </span>
              </div>
              <p className="text-xs text-[#A0A0AA] mt-1 max-w-2xl leading-relaxed font-sans">
                Every proposal strictly enforces: <code className="bg-[#222431] px-1.5 py-0.5 rounded font-mono text-white text-[11px] font-semibold border border-[#2D3142]">donor.postStock &ge; donor.minSafetyStock</code>. Donor clinics maintain sufficient buffer for anticipated demand; no clinic is ever compromised.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto bg-[#222431] px-3.5 py-1.5 rounded-lg border border-[#2D3142] text-xs">
            <span className="font-mono font-bold text-[#A4AADE] text-sm tabular-nums">{stats.total}</span>
            <span className="text-[#A0A0AA] font-sans">Valid Opportunities</span>
          </div>
        </div>
      </Reveal>

      {/* Filter Tabs */}
      <Reveal direction="up" delay={80}>
        <div className="flex items-center gap-1.5 border-b border-[#2D3142] pb-2 flex-wrap">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              selectedFilter === 'ALL'
                ? 'bg-[#2C3480] text-white shadow-sm'
                : 'text-[#A0A0AA] hover:text-white hover:bg-[#222431]'
            }`}
          >
            All Proposals ({stats.total})
          </button>
          <button
            onClick={() => setSelectedFilter('CRITICAL')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              selectedFilter === 'CRITICAL'
                ? 'bg-[#BB232B] text-white'
                : 'text-[#FF6B72] hover:bg-[#BB232B]/20'
            }`}
          >
            Critical ({stats.critical})
          </button>
          <button
            onClick={() => setSelectedFilter('HIGH')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              selectedFilter === 'HIGH'
                ? 'bg-[#2C3480] text-white'
                : 'text-[#A0A0AA] hover:text-white hover:bg-[#222431]'
            }`}
          >
            High Priority ({stats.high})
          </button>
          <button
            onClick={() => setSelectedFilter('MEDIUM')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              selectedFilter === 'MEDIUM'
                ? 'bg-[#222431] text-white border border-[#2D3142]'
                : 'text-[#A0A0AA] hover:text-white hover:bg-[#222431]'
            }`}
          >
            Standard ({stats.medium})
          </button>
        </div>
      </Reveal>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredRecommendations.length === 0 ? (
          <Reveal direction="up" delay={100}>
            <div className="bg-[#171923] rounded-lg border border-[#2D3142] p-12 text-center shadow-lg">
              <CheckCircle2 className="w-8 h-8 text-[#5AA98C] mx-auto mb-2 opacity-90" />
              <h3 className="font-serif text-lg text-white">All Shortages Resolved or Balanced</h3>
              <p className="text-xs text-[#A0A0AA] max-w-md mx-auto mt-1 font-sans leading-relaxed">
                There are no pending redistribution proposals under the current criteria. You can recalculate or dispatch custom transfers.
              </p>
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#222431] hover:bg-[#2D3142] border border-[#2D3142] rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>Initiate Custom Transfer</span>
              </button>
            </div>
          </Reveal>
        ) : (
          <StaggerGroup staggerDelay={50} className="space-y-4">
            {filteredRecommendations.map((rec) => {
              const med = medicines.find((m) => m.id === rec.medicineId);
              const donor = clinics.find((c) => c.id === rec.donorClinicId);
              const recipient = clinics.find((c) => c.id === rec.recipientClinicId);
              const isExpanded = expandedExplanationId === rec.id;

              return (
                <div
                  key={rec.id}
                  className="bg-[#171923] rounded-lg border border-[#2D3142] hover:border-[#2C3480] transition-colors duration-150 overflow-hidden shadow-lg"
                >
                  {/* Proposal Header */}
                  <div className="p-4 sm:p-5 border-b border-[#2D3142] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#1c1f2e]">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={rec.urgency} size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-base text-white font-normal">{med?.name}</span>
                          <span className="text-xs text-[#A0A0AA] font-sans">({med?.dosageForm})</span>
                        </div>
                        <div className="text-[11px] text-[#A0A0AA] mt-0.5 flex items-center gap-2 font-mono">
                          <span>Batch: <strong className="text-white">{rec.batchNumber}</strong></span>
                          <span className="text-[#2D3142]">•</span>
                          <span>Expires: {rec.expiryDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Route & Distance Badge */}
                    <div className="flex items-center gap-2.5 text-xs">
                      <div className="flex items-center gap-1.5 bg-[#222431] px-2.5 py-1 rounded-lg border border-[#2D3142] text-[#A0A0AA] font-mono text-[11px]">
                        <Truck className="w-3.5 h-3.5 text-[#A0A0AA]" />
                        <span>{rec.distanceKm} km</span>
                        <span className="text-[#2D3142]">•</span>
                        <span>~{rec.estimatedTransitMinutes}m courier</span>
                      </div>

                      <div className="bg-[#2C3480] text-white px-3 py-1 rounded-lg font-mono text-xs font-bold tabular-nums">
                        Qty: {rec.recommendedQuantity} {med?.unit || 'units'}
                      </div>
                    </div>
                  </div>

                  {/* Transfer Diagram / Side-by-Side Facilities */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-11 gap-3.5 items-center">
                    {/* Donor Facility Column */}
                    <div className="md:col-span-5 bg-[#0A2B1D]/30 rounded-lg p-4 border border-[#16815D]/40">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#5AA98C] font-bold flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          Donor (Surplus)
                        </span>
                        <span className="font-mono text-xs font-bold text-white bg-[#171923] px-1.5 py-0.5 rounded border border-[#2D3142]">
                          {donor?.code}
                        </span>
                      </div>

                      <h4 className="font-serif text-sm text-white">{donor?.name}</h4>
                      <p className="text-[11px] text-[#A0A0AA] font-sans">{donor?.address}</p>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-[#171923] p-2 rounded-lg border border-[#2D3142]">
                          <span className="text-[10px] text-[#A0A0AA] block mb-0.5 font-sans">Pre-Transfer</span>
                          <span className="font-bold text-white text-xs tabular-nums">
                            {rec.donorPreStock} {med?.unit}
                          </span>
                        </div>
                        <div className="bg-[#16815D]/20 p-2 rounded-lg border border-[#16815D]/40">
                          <span className="text-[10px] text-[#5AA98C] block mb-0.5 font-sans">Post-Transfer</span>
                          <span className="font-bold text-[#5AA98C] text-xs tabular-nums">
                            {rec.donorPostStock} {med?.unit}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-[#A0A0AA] flex items-center gap-1.5 font-sans">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#5AA98C] flex-shrink-0" />
                        <span>
                          Preserves <strong className="text-white font-mono">{rec.donorSafetyStock} {med?.unit}</strong> safety reserve.
                        </span>
                      </div>
                    </div>

                    {/* Flow Arrow in Middle */}
                    <div className="md:col-span-1 flex flex-col items-center justify-center text-[#A0A0AA] py-1">
                      <div className="w-7 h-7 rounded-lg bg-[#222431] border border-[#2D3142] flex items-center justify-center shadow-xs">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-[#6872C4]" />
                      </div>
                      <span className="text-[10px] font-mono font-bold mt-1 text-[#A0A0AA] text-center tabular-nums">
                        {rec.recommendedQuantity} {med?.unit}
                      </span>
                    </div>

                    {/* Recipient Facility Column */}
                    <div className="md:col-span-5 bg-[#2D0D0F]/30 rounded-lg p-4 border border-[#BB232B]/40">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF6B72] font-bold flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          Recipient (Shortage)
                        </span>
                        <span className="font-mono text-xs font-bold text-white bg-[#171923] px-1.5 py-0.5 rounded border border-[#2D3142]">
                          {recipient?.code}
                        </span>
                      </div>

                      <h4 className="font-serif text-sm text-white">{recipient?.name}</h4>
                      <p className="text-[11px] text-[#A0A0AA] font-sans">{recipient?.address}</p>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-[#171923] p-2 rounded-lg border border-[#BB232B]/30">
                          <span className="text-[10px] block mb-0.5 text-[#FF6B72] font-sans">Pre-Transfer</span>
                          <span className="font-bold text-[#FF6B72] text-xs tabular-nums">
                            {rec.recipientPreStock} {med?.unit} ({rec.recipientPreDays}d)
                          </span>
                        </div>
                        <div className="bg-[#16815D]/20 p-2 rounded-lg border border-[#16815D]/40">
                          <span className="text-[10px] block mb-0.5 text-[#5AA98C] font-sans">Post-Transfer</span>
                          <span className="font-bold text-[#5AA98C] text-xs tabular-nums">
                            {rec.recipientPostStock} {med?.unit} ({rec.recipientPostDays}d)
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-[#A0A0AA] font-sans">
                        Safety target: <strong className="text-white font-mono">{rec.recipientSafetyStock} {med?.unit}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Algorithmic Rationale Bar */}
                  <div className="px-4 sm:px-5 py-3 border-t border-[#2D3142] bg-[#1c1f2e] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <p className="text-[#A0A0AA] leading-relaxed font-sans text-xs">
                        {rec.explanation.summary}
                      </p>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-[#2D3142] space-y-2 text-xs text-[#A0A0AA] font-sans">
                          <div>
                            <strong className="text-white">Donor Assessment:</strong> {rec.explanation.donorRationale}
                          </div>
                          <div>
                            <strong className="text-white">Recipient Assessment:</strong> {rec.explanation.recipientRationale}
                          </div>
                          <div>
                            <strong className="text-white">Safety Invariant:</strong>{' '}
                            <span className="text-[#5AA98C] font-medium">{rec.explanation.safetyCompliance}</span>
                          </div>
                          {rec.explanation.rejectedAlternatives && (
                            <div className="pt-1.5 border-t border-[#2D3142]">
                              <strong className="text-white">Refused Candidate Facilities:</strong>{' '}
                              <span className="text-[#FF6B72] font-medium">{rec.explanation.rejectedAlternatives}</span>
                            </div>
                          )}
                          {rec.explanation.quantityRationale && (
                            <div className="pt-2 border-t border-[#2D3142] bg-[#171923] p-2.5 rounded-lg border border-[#2D3142]">
                              <strong className="text-white block mb-0.5 font-bold">Transfer Quantity Optimization:</strong>
                              <span className="text-[#A0A0AA] leading-relaxed block">{rec.explanation.quantityRationale}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setWalkthroughRec(rec)}
                        className="text-xs font-medium text-[#A4AADE] hover:text-white transition-colors mr-2 cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480] rounded px-1.5 py-0.5"
                        title="Open step-by-step audit walkthrough"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#6872C4]" />
                        <span>Walkthrough</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedExplanationId(isExpanded ? null : rec.id)}
                        className="text-xs font-medium text-[#A0A0AA] hover:text-white transition-colors mr-1 cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480] rounded px-1.5 py-0.5"
                      >
                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => rejectRecommendation(rec.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#A0A0AA] hover:text-white hover:bg-[#222431] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480]"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Dismiss</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => acceptRecommendation(rec.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-white bg-[#2C3480] hover:bg-[#232a6b] shadow-md transition-colors cursor-pointer active:scale-95 border border-[#3D479E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480]"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Execute</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </StaggerGroup>
        )}
      </div>

      {/* Manual Custom Transfer Modal */}
      <SafeTransferModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />
    </div>
  );
};

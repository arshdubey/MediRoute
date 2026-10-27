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
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-concrete">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-vermilion inline-block" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                Section 03 • Inter-Facility Redistribution
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-ink tracking-tight font-normal">
              Redistribution Proposals
            </h1>
            <p className="text-xs sm:text-sm text-graphite mt-1 max-w-2xl font-sans leading-relaxed">
              Deterministic surplus-to-deficit pairings calculated to eliminate stockouts while maintaining full safety reserves at donor clinics.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {activeRecommendations.length > 0 && !walkthroughRec && (
              <button
                onClick={() => setWalkthroughRec(activeRecommendations[0])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink bg-white hover:bg-concrete/40 border border-concrete rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
                title="Launch guided interactive audit of top proposal"
              >
                <Sparkles className="w-3.5 h-3.5 text-vermilion" />
                <span>Guided Walkthrough</span>
              </button>
            )}

            <button
              onClick={refreshRecommendations}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-graphite hover:text-ink bg-white hover:bg-concrete/30 border border-concrete rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
              title="Recalculate matches"
            >
              <RefreshCw className="w-3.5 h-3.5 text-muted" />
              <span>Recalculate</span>
            </button>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-ink hover:bg-black border border-ink rounded transition-colors cursor-pointer shadow-xs active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
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
        <div className="bg-white rounded border border-concrete p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded bg-paper border border-concrete flex items-center justify-center flex-shrink-0 text-clinicalGreen mt-0.5">
              <ShieldCheck className="w-4 h-4 text-clinicalGreen" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-mono uppercase tracking-wider text-ink font-bold">
                  Mathematical Safety Invariant Guaranteed
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-clinicalGreen/10 text-clinicalGreen border border-clinicalGreen/30">
                  Active
                </span>
              </div>
              <p className="text-xs text-graphite mt-1 max-w-2xl leading-relaxed font-sans">
                Every proposal strictly enforces: <code className="bg-paper px-1.5 py-0.5 rounded font-mono text-ink text-[11px] font-semibold border border-concrete">donor.postStock &ge; donor.minSafetyStock</code>. Donor clinics maintain sufficient buffer for anticipated demand; no clinic is ever compromised.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto bg-paper px-3 py-1.5 rounded border border-concrete text-xs">
            <span className="font-mono font-bold text-ink text-sm tabular-nums">{stats.total}</span>
            <span className="text-muted font-sans">Valid Opportunities</span>
          </div>
        </div>
      </Reveal>

      {/* Filter Tabs */}
      <Reveal direction="up" delay={80}>
        <div className="flex items-center gap-1.5 border-b border-concrete pb-2 flex-wrap">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              selectedFilter === 'ALL'
                ? 'bg-ink text-white'
                : 'text-graphite hover:text-ink hover:bg-concrete/40'
            }`}
          >
            All Proposals ({stats.total})
          </button>
          <button
            onClick={() => setSelectedFilter('CRITICAL')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              selectedFilter === 'CRITICAL'
                ? 'bg-vermilion text-white'
                : 'text-vermilion hover:bg-vermilion/10'
            }`}
          >
            Critical ({stats.critical})
          </button>
          <button
            onClick={() => setSelectedFilter('HIGH')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              selectedFilter === 'HIGH'
                ? 'bg-graphite text-white'
                : 'text-graphite hover:text-ink hover:bg-concrete/40'
            }`}
          >
            High Priority ({stats.high})
          </button>
          <button
            onClick={() => setSelectedFilter('MEDIUM')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              selectedFilter === 'MEDIUM'
                ? 'bg-graphite text-white'
                : 'text-graphite hover:text-ink hover:bg-concrete/40'
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
            <div className="bg-white rounded border border-concrete p-12 text-center shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-clinicalGreen mx-auto mb-2 opacity-90" />
              <h3 className="font-serif text-lg text-ink">All Shortages Resolved or Balanced</h3>
              <p className="text-xs text-graphite max-w-md mx-auto mt-1 font-sans leading-relaxed">
                There are no pending redistribution proposals under the current criteria. You can recalculate or dispatch custom transfers.
              </p>
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink bg-paper hover:bg-concrete/50 border border-concrete rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-ink" />
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
                  className="bg-white rounded border border-concrete hover:border-graphite/40 transition-colors duration-150 overflow-hidden shadow-xs"
                >
                  {/* Proposal Header */}
                  <div className="p-4 sm:p-5 border-b border-concrete flex flex-col md:flex-row md:items-center justify-between gap-3 bg-paper">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={rec.urgency} size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-base text-ink font-normal">{med?.name}</span>
                          <span className="text-xs text-muted font-sans">({med?.dosageForm})</span>
                        </div>
                        <div className="text-[11px] text-graphite mt-0.5 flex items-center gap-2 font-mono">
                          <span>Batch: <strong className="text-ink">{rec.batchNumber}</strong></span>
                          <span className="text-concrete">•</span>
                          <span>Expires: {rec.expiryDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Route & Distance Badge */}
                    <div className="flex items-center gap-2.5 text-xs">
                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-concrete text-graphite font-mono text-[11px]">
                        <Truck className="w-3.5 h-3.5 text-muted" />
                        <span>{rec.distanceKm} km</span>
                        <span className="text-concrete">•</span>
                        <span>~{rec.estimatedTransitMinutes}m courier</span>
                      </div>

                      <div className="bg-ink text-white px-3 py-1 rounded font-mono text-xs font-bold tabular-nums">
                        Qty: {rec.recommendedQuantity} {med?.unit || 'units'}
                      </div>
                    </div>
                  </div>

                  {/* Transfer Diagram / Side-by-Side Facilities */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-11 gap-3.5 items-center">
                    {/* Donor Facility Column */}
                    <div className="md:col-span-5 bg-paper rounded p-4 border border-concrete">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-clinicalGreen font-bold flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          Donor (Surplus)
                        </span>
                        <span className="font-mono text-xs font-bold text-ink bg-white px-1.5 py-0.5 rounded border border-concrete">
                          {donor?.code}
                        </span>
                      </div>

                      <h4 className="font-serif text-sm text-ink">{donor?.name}</h4>
                      <p className="text-[11px] text-muted font-sans">{donor?.address}</p>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-white p-2 rounded border border-concrete">
                          <span className="text-[10px] text-muted block mb-0.5 font-sans">Pre-Transfer</span>
                          <span className="font-bold text-ink text-xs tabular-nums">
                            {rec.donorPreStock} {med?.unit}
                          </span>
                        </div>
                        <div className="bg-clinicalGreen/5 p-2 rounded border border-clinicalGreen/30">
                          <span className="text-[10px] text-clinicalGreen block mb-0.5 font-sans">Post-Transfer</span>
                          <span className="font-bold text-clinicalGreen text-xs tabular-nums">
                            {rec.donorPostStock} {med?.unit}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-graphite flex items-center gap-1.5 font-sans">
                        <ShieldCheck className="w-3.5 h-3.5 text-clinicalGreen flex-shrink-0" />
                        <span>
                          Preserves <strong className="text-ink font-mono">{rec.donorSafetyStock} {med?.unit}</strong> safety reserve.
                        </span>
                      </div>
                    </div>

                    {/* Flow Arrow in Middle */}
                    <div className="md:col-span-1 flex flex-col items-center justify-center text-graphite py-1">
                      <div className="w-7 h-7 rounded bg-white border border-concrete flex items-center justify-center shadow-xs">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-ink" />
                      </div>
                      <span className="text-[10px] font-mono font-bold mt-1 text-muted text-center tabular-nums">
                        {rec.recommendedQuantity} {med?.unit}
                      </span>
                    </div>

                    {/* Recipient Facility Column */}
                    <div className="md:col-span-5 bg-vermilion/5 rounded p-4 border border-vermilion/30">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-vermilion font-bold flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          Recipient (Shortage)
                        </span>
                        <span className="font-mono text-xs font-bold text-ink bg-white px-1.5 py-0.5 rounded border border-concrete">
                          {recipient?.code}
                        </span>
                      </div>

                      <h4 className="font-serif text-sm text-ink">{recipient?.name}</h4>
                      <p className="text-[11px] text-muted font-sans">{recipient?.address}</p>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-white p-2 rounded border border-vermilion/30">
                          <span className="text-[10px] block mb-0.5 text-vermilion font-sans">Pre-Transfer</span>
                          <span className="font-bold text-vermilion text-xs tabular-nums">
                            {rec.recipientPreStock} {med?.unit} ({rec.recipientPreDays}d)
                          </span>
                        </div>
                        <div className="bg-clinicalGreen/5 p-2 rounded border border-clinicalGreen/30">
                          <span className="text-[10px] block mb-0.5 text-clinicalGreen font-sans">Post-Transfer</span>
                          <span className="font-bold text-clinicalGreen text-xs tabular-nums">
                            {rec.recipientPostStock} {med?.unit} ({rec.recipientPostDays}d)
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-graphite font-sans">
                        Safety target: <strong className="text-ink font-mono">{rec.recipientSafetyStock} {med?.unit}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Algorithmic Rationale Bar */}
                  <div className="px-4 sm:px-5 py-3 border-t border-concrete bg-paper flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <p className="text-graphite leading-relaxed font-sans text-xs">
                        {rec.explanation.summary}
                      </p>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-concrete space-y-2 text-xs text-graphite font-sans">
                          <div>
                            <strong className="text-ink">Donor Assessment:</strong> {rec.explanation.donorRationale}
                          </div>
                          <div>
                            <strong className="text-ink">Recipient Assessment:</strong> {rec.explanation.recipientRationale}
                          </div>
                          <div>
                            <strong className="text-ink">Safety Invariant:</strong>{' '}
                            <span className="text-clinicalGreen font-medium">{rec.explanation.safetyCompliance}</span>
                          </div>
                          {rec.explanation.rejectedAlternatives && (
                            <div className="pt-1.5 border-t border-concrete">
                              <strong className="text-ink">Refused Candidate Facilities:</strong>{' '}
                              <span className="text-vermilion font-medium">{rec.explanation.rejectedAlternatives}</span>
                            </div>
                          )}
                          {rec.explanation.quantityRationale && (
                            <div className="pt-2 border-t border-concrete bg-white p-2.5 rounded border border-concrete">
                              <strong className="text-ink block mb-0.5 font-bold">Transfer Quantity Optimization:</strong>
                              <span className="text-graphite leading-relaxed block">{rec.explanation.quantityRationale}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setWalkthroughRec(rec)}
                        className="text-xs font-medium text-vermilion hover:text-ink transition-colors mr-2 cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion rounded px-1.5 py-0.5"
                        title="Open step-by-step audit walkthrough"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-vermilion" />
                        <span>Walkthrough</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedExplanationId(isExpanded ? null : rec.id)}
                        className="text-xs font-medium text-graphite hover:text-ink transition-colors mr-1 cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink rounded px-1.5 py-0.5"
                      >
                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => rejectRecommendation(rec.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-graphite hover:text-ink hover:bg-concrete/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Dismiss</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => acceptRecommendation(rec.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium text-white bg-ink hover:bg-black shadow-xs transition-colors cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
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

import React, { useState } from 'react';
import {
  CalendarClock,
  Play,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  Award,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExpiryOverviewCards } from './ExpiryOverviewCards';
import { ExpiryTimeline } from './ExpiryTimeline';
import { FEFORecommendationsList } from './FEFORecommendationsList';
import { WastageSimulator } from './WastageSimulator';
import { WastageImpactSection } from './WastageImpactSection';
import { The24DayChallengeWalkthrough } from './The24DayChallengeWalkthrough';
import { FEFOSafeTransferModal } from './FEFOSafeTransferModal';
import { FEFORedistributionRecommendation, ExpiryBatchAnalysis } from '../../services/fefoEngine';

export const ExpiryIntelligenceView: React.FC = () => {
  const {
    stockRecords,
    clinics,
    medicines,
    fefoRecommendations,
    expiryOverviewMetrics,
    fefoWalkthroughActive,
    setFefoWalkthroughActive,
    runFEFODemoScenario,
  } = useApp();

  // Selected recommendation for simulation & confirmation
  const [selectedRec, setSelectedRec] = useState<FEFORedistributionRecommendation | null>(
    fefoRecommendations[0] || null
  );

  // Selected batch in timeline
  const [selectedBatch, setSelectedBatch] = useState<ExpiryBatchAnalysis | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTargetRec, setModalTargetRec] = useState<FEFORedistributionRecommendation | null>(null);
  const [modalCustomQty, setModalCustomQty] = useState<number | undefined>(undefined);

  // Filter state for timeline
  const [timelineFilter, setTimelineFilter] = useState<'ALL' | '7D' | '30D' | '60D' | '90D' | 'EXPIRED'>('ALL');

  // Handle opening confirmation modal
  const handleOpenConfirmModal = (rec: FEFORedistributionRecommendation, customQty?: number) => {
    setModalTargetRec(rec);
    setModalCustomQty(customQty);
    setIsModalOpen(true);
  };

  // Find Insulin recommendation for 24-day challenge
  const insulinRec =
    fefoRecommendations.find(
      (r) => r.donorClinicId === 'c5' && r.recipientClinicId === 'c1' && r.medicineId === 'm2'
    ) || fefoRecommendations[0] || null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Editorial Page Header */}
      <div className="space-y-4">
        {/* Eyebrow */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#737373] font-semibold">
              REGIONAL SUPPLY CHAIN / EXPIRY INTELLIGENCE
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2C3480]" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runFEFODemoScenario}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium text-white bg-[#2C3480] hover:bg-[#232a6b] transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480]"
            >
              <Play className="w-3.5 h-3.5 text-white" />
              <span>Launch The 24-Day Challenge</span>
            </button>
          </div>
        </div>

        {/* Oversized Editorial Serif Heading */}
        <div className="space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#080808] font-normal leading-[1.08]">
            Every medicine deserves to be used.
          </h1>
          <p className="text-sm sm:text-base text-[#737373] font-sans max-w-3xl leading-relaxed">
            Identify expiring pharmaceutical batches, calculate consumption feasibility, and redistribute eligible stock before it becomes medical waste.
          </p>
        </div>

        {/* Synthetic Data & Regulatory Notice */}
        <div className="bg-white border-l-4 border-l-[#2C3480] border-y border-r border-[#E5E5E8] p-3 rounded-r-lg text-xs text-[#737373] font-sans flex items-center justify-between shadow-xs">
          <div>
            <strong className="text-[#080808]">Demonstration & Compliance Standard: </strong>
            First-Expiry-First-Out (FEFO) optimization engine operates on seeded regional hospital batches. All proposals strictly preserve donor safety reserves.
          </div>
          <span className="hidden sm:inline-block font-mono text-[11px] text-[#737373]">
            v2.4 FEFO Deterministic
          </span>
        </div>
      </div>

      {/* Guided Walkthrough Experience: The 24-Day Challenge */}
      {fefoWalkthroughActive && (
        <The24DayChallengeWalkthrough
          insulinRecommendation={insulinRec}
          onOpenConfirmModal={handleOpenConfirmModal}
          onClose={() => setFefoWalkthroughActive(false)}
        />
      )}

      {/* Section 1: Expiry Risk Overview */}
      <section className="space-y-3" aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Expiry Risk Overview
        </h2>
        <ExpiryOverviewCards
          metrics={expiryOverviewMetrics}
          activeFilter={timelineFilter}
          onFilterSelect={(f) => setTimelineFilter(f)}
        />
      </section>

      {/* Section 2: Expiry Timeline */}
      <section className="space-y-3" aria-labelledby="timeline-heading">
        <ExpiryTimeline
          stockRecords={stockRecords}
          clinics={clinics}
          medicines={medicines}
          selectedBatchNumber={selectedBatch?.batchNumber}
          activeFilter={timelineFilter}
          onFilterChange={(f) => setTimelineFilter(f)}
          onSelectBatch={(batch) => {
            setSelectedBatch(batch);
            // If this batch matches a recommendation, select it
            const matchingRec = fefoRecommendations.find((r) => r.batchNumber === batch.batchNumber);
            if (matchingRec) setSelectedRec(matchingRec);
          }}
        />
      </section>

      {/* Section 3: Recommended Expiry-Safe Transfers (FEFO Proposals) */}
      <section className="space-y-3" aria-labelledby="recommendations-heading">
        <FEFORecommendationsList
          recommendations={fefoRecommendations}
          onOpenConfirmModal={(rec) => handleOpenConfirmModal(rec)}
          onOpenSimulator={(rec) => {
            setSelectedRec(rec);
            // Smooth scroll to simulator
            const simEl = document.getElementById('wastage-simulator-section');
            if (simEl) simEl.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </section>

      {/* Section 4: Interactive Wastage Prevention Simulator */}
      <section id="wastage-simulator-section" className="space-y-3" aria-labelledby="simulator-heading">
        <WastageSimulator
          selectedRecommendation={selectedRec}
          allRecommendations={fefoRecommendations}
          onSelectRecommendation={(rec) => setSelectedRec(rec)}
          onLaunchConfirmation={(rec, simulatedQty) => handleOpenConfirmModal(rec, simulatedQty)}
        />
      </section>

      {/* Section 5: Wastage Impact & Audit Ledger Section */}
      <section className="space-y-3" aria-labelledby="impact-heading">
        <WastageImpactSection metrics={expiryOverviewMetrics} />
      </section>

      {/* Authoritative Confirmation Modal */}
      <FEFOSafeTransferModal
        recommendation={modalTargetRec}
        customQuantity={modalCustomQty}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalTargetRec(null);
        }}
      />
    </div>
  );
};

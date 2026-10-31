import React, { useState } from 'react';
import {
  Calendar,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Building2,
  DollarSign,
  TrendingDown,
  X,
} from 'lucide-react';
import { FEFORedistributionRecommendation } from '../../services/fefoEngine';

interface The24DayChallengeWalkthroughProps {
  insulinRecommendation: FEFORedistributionRecommendation | null;
  onOpenConfirmModal: (rec: FEFORedistributionRecommendation) => void;
  onClose: () => void;
}

export const The24DayChallengeWalkthrough: React.FC<The24DayChallengeWalkthroughProps> = ({
  insulinRecommendation,
  onOpenConfirmModal,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 8;

  const steps = [
    {
      title: 'Batch Discovery & Imminent Expiry',
      subtitle: 'Identify high-value pharmaceutical inventory approaching expiration window',
    },
    {
      title: 'Local Consumption Feasibility Bottleneck',
      subtitle: 'Calculate donor daily burn rate against calendar days to expiration',
    },
    {
      title: 'Regional Deficit Identification',
      subtitle: 'Identify connected network facility holding acute shortage of same formulation',
    },
    {
      title: 'Algorithmic FEFO Transfer Quantity',
      subtitle: 'Determine exact quantity that resolves wastage without secondary expiry',
    },
    {
      title: 'Constraint Refusal of Ineligible Facilities',
      subtitle: 'Examine why other regional clinics were rejected by constraint engine',
    },
    {
      title: 'Donor Minimum Safety Reserve Proof',
      subtitle: 'Strict mathematical proof of invariant: donor.postStock >= minSafetyStock',
    },
    {
      title: 'Wastage Avoided & Value Preserved',
      subtitle: 'Calculate physical units saved from incineration and financial budget preserved',
    },
    {
      title: 'Production Approval & Dispatch Verification',
      subtitle: 'Proceed to authoritative atomic transaction workflow to confirm transfer',
    },
  ];

  return (
    <div className="bg-[#080808] text-white rounded-lg border border-[#2C3480]/50 p-5 sm:p-6 shadow-xl space-y-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#2C3480]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Walkthrough Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 relative z-10">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#BB232B] bg-[#BB232B]/20 px-2 py-0.5 rounded-lg border border-[#BB232B]/40 font-bold">
              Interactive Showcase Scenario
            </span>
            <span className="text-xs font-mono text-[#737373]">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <h3 className="font-serif text-2xl text-white font-normal tracking-tight">
            The 24-Day Challenge: FEFO Wastage Prevention
          </h3>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="inline-flex items-center gap-1 text-xs text-[#E5E5E8] hover:text-white bg-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-white/10"
            title="Restart walkthrough from Step 1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restart</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#737373] hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Close walkthrough"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Stepper Bar */}
      <div className="space-y-1 relative z-10">
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            className="bg-[#2C3480] h-full transition-all duration-300"
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-[#737373]">
          <span>1. Discovery</span>
          <span>3. Deficit</span>
          <span>5. Refusals</span>
          <span>7. Impact</span>
          <span>8. Dispatch</span>
        </div>
      </div>

      {/* Dynamic Step Content */}
      <div className="bg-white/5 rounded-lg border border-white/10 p-4 sm:p-5 min-h-[220px] flex flex-col justify-between relative z-10">
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-xs font-mono text-[#2C3480] uppercase tracking-wider font-semibold">
              Step {currentStep}: {steps[currentStep - 1].title}
            </span>
            <p className="text-xs text-[#E5E5E8] font-sans">
              {steps[currentStep - 1].subtitle}
            </p>
          </div>

          {/* Step 1: Batch Discovery */}
          {currentStep === 1 && (
            <div className="space-y-2 text-xs font-sans text-[#E5E5E8]">
              <p>
                In the regional inventory matrix, <strong className="text-white">Pinecrest Family Medical Post (PFM)</strong> holds a rural stock of <strong className="text-white">Insulin Glargine 100 U/mL SoloStar Pens</strong> (Batch <code className="text-[#B87A14] font-mono">#INS-2026-EXP-A</code>).
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/5 p-3 rounded-lg border border-white/10 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-[#737373] block">Current Stock</span>
                  <span className="text-white font-bold text-sm">90 pens</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#737373] block">Safety Reserve</span>
                  <span className="text-white font-bold text-sm">20 pens</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#737373] block">Expiry Horizon</span>
                  <span className="text-[#BB232B] font-bold text-sm">24 days</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#737373] block">Wholesale Value</span>
                  <span className="text-white font-bold text-sm">$2,565.00</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Local Feasibility Bottleneck */}
          {currentStep === 2 && (
            <div className="space-y-2 text-xs font-sans text-[#E5E5E8]">
              <p>
                Pinecrest serves an outpatient rural patient base with an average burn rate of only <strong className="text-white font-mono">2 pens/day</strong>.
              </p>
              <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span>Projected Local Consumption (24 days &times; 2 pens/day):</span>
                  <span className="text-white font-bold">48 pens</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-1">
                  <span>Guaranteed Expired Medical Waste without intervention:</span>
                  <span className="text-[#BB232B] font-bold">42 pens ($1,197.00 loss)</span>
                </div>
              </div>
              <p className="text-[11px] text-[#737373]">
                Even if Pinecrest retains all 48 pens to cover 100% of its local patients until the exact day of expiry, 42 pens will expire unused on clinic shelves.
              </p>
            </div>
          )}

          {/* Step 3: Regional Deficit Identification */}
          {currentStep === 3 && (
            <div className="space-y-2 text-xs font-sans text-[#E5E5E8]">
              <p>
                The MediRoute regional topology scans connected clinics holding this exact formulation (<code className="text-[#B87A14] font-mono">m2 - Insulin Glargine</code>).
              </p>
              <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">Metro Hope General Hospital (MHG)</span>
                  <span className="text-[10px] font-mono text-[#BB232B] bg-[#BB232B]/20 px-2 py-0.5 rounded-lg border border-[#BB232B]/40">
                    Critical Deficit (2.5d runway)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs text-[#E5E5E8] pt-1 border-t border-white/10">
                  <div>On Hand: <strong className="text-white">45 pens</strong></div>
                  <div>Safety Min: <strong className="text-white">120 pens</strong></div>
                  <div>Burn: <strong className="text-white">18 pens/day</strong></div>
                </div>
              </div>
              <p className="text-[11px] text-[#737373]">
                In 24 days, Metro Hope's high inpatient census will consume <strong className="text-white font-mono">432 pens</strong>. It has massive absorption capacity to use the expiring surplus safely.
              </p>
            </div>
          )}

          {/* Step 4: Algorithmic FEFO Transfer Quantity */}
          {currentStep === 4 && (
            <div className="space-y-2 text-xs font-sans text-[#E5E5E8]">
              <p>
                The FEFO constraint engine calculates the mathematical transfer quantity:
              </p>
              <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span>Transferable Surplus at Donor (min(42 at risk, 70 above reserve)):</span>
                  <span className="text-white font-bold">42 pens</span>
                </div>
                <div className="flex justify-between">
                  <span>Recipient Absorption Capacity (24d &times; 18 pens/day):</span>
                  <span className="text-white font-bold">432 pens</span>
                </div>
                <div className="flex justify-between text-[#16815D] font-bold border-t border-white/10 pt-1">
                  <span>Optimized Recommended Dispatch Quantity:</span>
                  <span>42 pens</span>
                </div>
              </div>
              <p className="text-[11px] text-[#737373]">
                This transfer exacts 100% wastage reduction without leaving partial batch remnants or creating secondary expiry.
              </p>
            </div>
          )}

          {/* Step 5: Constraint Refusal of Ineligible Facilities */}
          {currentStep === 5 && (
            <div className="space-y-2 text-xs font-sans text-[#E5E5E8]">
              <p>
                Why were alternative facilities refused by the constraint engine?
              </p>
              <div className="space-y-1.5 text-xs font-sans">
                <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 flex justify-between items-center">
                  <span><strong>SJC - St. Jude Health Center:</strong> Holds 65 units (burn: 6/d, runway: 10.8d).</span>
                  <span className="text-[10px] text-[#B87A14] font-mono">Adequate Runway</span>
                </div>
                <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 flex justify-between items-center">
                  <span><strong>RPC - Riverdale Pediatric:</strong> Specialized pediatric formulary; low adult insulin volume.</span>
                  <span className="text-[10px] text-[#BB232B] font-mono">Formulary Mismatch</span>
                </div>
                <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 flex justify-between items-center">
                  <span><strong>NUC - Northside Urgent Care:</strong> Current stock 80 units; at maximum storage capacity.</span>
                  <span className="text-[10px] text-[#BB232B] font-mono">Storage Limit Reached</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Donor Safety Reserve Invariant Proof */}
          {currentStep === 6 && (
            <div className="space-y-2 text-xs font-sans text-[#E5E5E8]">
              <p>
                Strict verification of MediRoute's primary healthcare logistics safety invariant:
              </p>
              <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-2 font-mono text-xs">
                <div className="text-center text-[#16815D] font-bold text-sm bg-[#16815D]/20 p-2 rounded-lg border border-[#16815D]/40">
                  donor.postStock (48) &ge; donor.minSafetyStock (20) &rarr; SATISFIED
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[#E5E5E8] pt-1">
                  <div>Pre-Transfer: 90</div>
                  <div>Dispatched: -42</div>
                  <div className="text-[#16815D] font-bold">Post-Transfer: 48</div>
                </div>
              </div>
              <p className="text-[11px] text-[#737373]">
                Pinecrest retains a generous +28 unit safety buffer above its required threshold. Local rural clinic operations are 100% protected.
              </p>
            </div>
          )}

          {/* Step 7: Wastage Avoided & Value Preserved */}
          {currentStep === 7 && (
            <div className="space-y-2 text-xs font-sans text-[#E5E5E8]">
              <p>
                Measurable clinical and budgetary outcomes achieved through this single FEFO transfer:
              </p>
              <div className="grid grid-cols-2 gap-3 bg-white/5 p-3.5 rounded-lg border border-white/10">
                <div className="space-y-1">
                  <span className="text-[10px] text-[#737373] font-mono uppercase block">Physical Stock Saved</span>
                  <span className="text-xl font-mono font-bold text-white">42 SoloStar Pens</span>
                  <span className="text-[11px] text-[#16815D] block font-sans">100% of at-risk surplus preserved</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-[#737373] font-mono uppercase block">Financial Loss Averted</span>
                  <span className="text-xl font-mono font-bold text-[#16815D]">$1,197.00</span>
                  <span className="text-[11px] text-[#E5E5E8] block font-sans">42 units &times; $28.50 unit cost</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Production Approval & Dispatch Verification */}
          {currentStep === 8 && (
            <div className="space-y-3 text-xs font-sans text-[#E5E5E8]">
              <p>
                The recommendation is verified and ready for execution through MediRoute's existing atomic dispatch pipeline:
              </p>
              <div className="bg-[#16815D]/20 border border-[#16815D]/40 p-3 rounded-lg space-y-1.5 text-xs text-white">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#16815D]" />
                  <span>Ready for One-Click Clinical Confirmation</span>
                </div>
                <p className="text-[11px] text-[#E5E5E8]">
                  Confirming will atomically deduct 42 pens from Pinecrest, add 42 pens to Metro Hope General, and append a verified timestamped record to the audit ledger.
                </p>
              </div>

              {insulinRecommendation && (
                <button
                  type="button"
                  onClick={() => onOpenConfirmModal(insulinRecommendation)}
                  className="w-full py-2.5 rounded-lg bg-[#16815D] hover:bg-[#126b4c] text-white font-medium text-xs font-sans transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Execute The 24-Day Challenge Dispatch (42 Units)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stepper Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-colors cursor-pointer ${
              currentStep === 1
                ? 'text-[#737373] cursor-not-allowed'
                : 'text-[#E5E5E8] hover:text-white bg-white/10'
            }`}
          >
            &larr; Previous Step
          </button>

          <div className="text-[11px] font-mono text-[#737373]">
            Step {currentStep} / {totalSteps}
          </div>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium text-white bg-[#2C3480] hover:bg-[#232a6b] transition-colors cursor-pointer shadow-xs"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-3 py-1.5 rounded-lg text-xs font-sans text-[#E5E5E8] hover:text-white bg-white/10 transition-colors cursor-pointer"
            >
              Back to Start
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

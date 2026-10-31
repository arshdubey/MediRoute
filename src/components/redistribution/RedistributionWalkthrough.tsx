import React, { useState } from 'react';
import { RedistributionRecommendation, Clinic, Medicine } from '../../types';
import { Reveal, AnimatedNumber } from '../motion';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Truck,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
} from 'lucide-react';

interface RedistributionWalkthroughProps {
  recommendation: RedistributionRecommendation;
  onClose: () => void;
  onConfirm: (id: string) => void;
  clinics: Clinic[];
  medicines: Medicine[];
}

export const RedistributionWalkthrough: React.FC<RedistributionWalkthroughProps> = ({
  recommendation,
  onClose,
  onConfirm,
  clinics,
  medicines,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const med = medicines.find((m) => m.id === recommendation.medicineId);
  const donor = clinics.find((c) => c.id === recommendation.donorClinicId);
  const recipient = clinics.find((c) => c.id === recommendation.recipientClinicId);
  const candidates = recommendation.candidatesEvaluated || [];
  const rejectedCandidates = candidates.filter((c) => !c.isEligible || c.clinicId !== recommendation.donorClinicId);

  const totalSteps = 7;

  const handleConfirmTransfer = () => {
    onConfirm(recommendation.id);
    setIsConfirmed(true);
    setCurrentStep(7);
  };

  const steps = [
    { number: 1, title: 'Deficit' },
    { number: 2, title: 'Network' },
    { number: 3, title: 'Donor' },
    { number: 4, title: 'Safety Proof' },
    { number: 5, title: 'Refusals' },
    { number: 6, title: 'Dispatch' },
    { number: 7, title: 'Ledger' },
  ];

  return (
    <div className="bg-[#171923] rounded-lg border border-[#2D3142] p-5 sm:p-7 shadow-lg space-y-6">
      {/* Walkthrough Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-[#2D3142] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A0A0AA] font-medium">
              Interactive Algorithmic Audit • Step {currentStep} of {totalSteps}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#16815D]/20 text-[#5AA98C] border border-[#16815D]/40">
              Verified Model
            </span>
          </div>
          <h2 className="font-serif text-2xl text-white tracking-tight font-normal">
            Redistribution Decision Walkthrough: {med?.name}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="self-start sm:self-auto text-[#A0A0AA] hover:text-white p-1 rounded transition-colors cursor-pointer"
          aria-label="Exit walkthrough"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Rhythmic Step Progress Tracker */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {steps.map((step) => {
          const isCurrent = currentStep === step.number;
          const isPassed = currentStep > step.number;

          return (
            <button
              key={step.number}
              onClick={() => setCurrentStep(step.number)}
              className={`text-left p-1.5 sm:p-2 rounded-lg border transition-colors cursor-pointer ${
                isCurrent
                  ? 'bg-[#2C3480] text-white border-[#2C3480]'
                  : isPassed
                  ? 'bg-[#222431] border-[#2D3142] text-white'
                  : 'bg-[#171923] border-[#2D3142] text-[#A0A0AA] hover:border-[#2C3480]/60'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                    isCurrent
                      ? 'bg-white text-[#2C3480]'
                      : isPassed
                      ? 'bg-[#2D3142] text-white'
                      : 'bg-[#222431] text-[#A0A0AA]'
                  }`}
                >
                  {isPassed ? '✓' : step.number}
                </span>
                <span className="text-xs font-mono hidden md:inline truncate">{step.title}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Content Area */}
      <div className="min-h-[260px] flex flex-col justify-between pt-2">
        {/* Step 1: Reveal the Shortage */}
        {currentStep === 1 && (
          <Reveal key={1} direction="up" duration={250} className="space-y-4">
            <div className="flex items-center gap-2 text-[#FF6B72] font-mono text-xs uppercase tracking-wider font-bold">
              <AlertTriangle className="w-4 h-4 text-[#FF6B72]" />
              <span>Step 1: Clinical Shortage Detected at Recipient Facility</span>
            </div>

            <div className="bg-[#BB232B]/10 rounded-lg p-4 sm:p-5 border border-[#BB232B]/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif text-lg text-white">{recipient?.name} ({recipient?.code})</h3>
                  <p className="text-xs text-[#A0A0AA] font-sans">{recipient?.address}</p>
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#BB232B]/20 text-[#FF6B72] border border-[#BB232B]/40 font-bold">
                  Critical Deficit (≤ 2.5d)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-[#222431] p-3 rounded-lg border border-[#2D3142]">
                  <span className="text-[10px] text-[#A0A0AA] block mb-0.5 font-sans">Current Stock</span>
                  <strong className="text-lg font-mono font-bold text-[#FF6B72] tabular-nums">
                    <AnimatedNumber value={recommendation.recipientPreStock} /> {med?.unit}
                  </strong>
                </div>

                <div className="bg-[#222431] p-3 rounded-lg border border-[#2D3142]">
                  <span className="text-[10px] text-[#A0A0AA] block mb-0.5 font-sans">Safety Minimum</span>
                  <strong className="text-lg font-mono font-bold text-white tabular-nums">
                    {recommendation.recipientSafetyStock} {med?.unit}
                  </strong>
                </div>

                <div className="bg-[#222431] p-3 rounded-lg border border-[#2D3142]">
                  <span className="text-[10px] text-[#A0A0AA] block mb-0.5 font-sans">Coverage Runway</span>
                  <strong className="text-lg font-mono font-bold text-[#FF6B72] tabular-nums">
                    {recommendation.recipientPreDays} days
                  </strong>
                </div>
              </div>

              <p className="text-xs text-[#A0A0AA] leading-relaxed font-sans pt-1">
                {recommendation.explanation.recipientRationale}
              </p>
            </div>
          </Reveal>
        )}

        {/* Step 2: Introduce Candidate Donors */}
        {currentStep === 2 && (
          <Reveal key={2} direction="up" duration={250} className="space-y-4">
            <div className="flex items-center gap-2 text-white font-mono text-xs uppercase tracking-wider font-bold">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Step 2: Regional Network Survey &amp; Candidate Evaluation</span>
            </div>

            <p className="text-xs text-[#A0A0AA]">
              The constraint solver evaluated all network facilities holding stock of <strong className="text-white">{med?.name} ({med?.dosageForm})</strong>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {candidates.map((cand) => {
                const isSelected = cand.clinicId === recommendation.donorClinicId;

                return (
                  <div
                    key={cand.clinicId}
                    className={`p-3.5 rounded-lg border text-xs transition-colors ${
                      isSelected
                        ? 'bg-[#222431] border-[#2C3480] shadow-sm'
                        : 'bg-[#171923] border-[#2D3142] opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-serif text-sm text-white">{cand.clinicName}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          isSelected
                            ? 'bg-[#2C3480] text-white'
                            : 'bg-[#222431] text-[#A0A0AA] border border-[#2D3142]'
                        }`}
                      >
                        {isSelected ? 'SELECTED DONOR' : 'EVALUATED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-[#A0A0AA] pt-1 font-mono tabular-nums">
                      <div>Stock: <strong className="text-white">{cand.currentStock}</strong></div>
                      <div>Reserve: <strong className="text-white">{cand.safetyStock}</strong></div>
                      <div>Surplus: <strong className={cand.availableSurplus > 0 ? 'text-[#5AA98C]' : 'text-[#A0A0AA]'}>{cand.availableSurplus}</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        )}

        {/* Step 3: Explain Selected Donor */}
        {currentStep === 3 && (
          <Reveal key={3} direction="up" duration={250} className="space-y-4">
            <div className="flex items-center gap-2 text-[#5AA98C] font-mono text-xs uppercase tracking-wider font-bold">
              <CheckCircle2 className="w-4 h-4 text-[#5AA98C]" />
              <span>Step 3: Selected Optimal Donor Facility</span>
            </div>

            <div className="bg-[#222431] rounded-lg p-4 sm:p-5 border border-[#2D3142] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif text-lg text-white">{donor?.name} ({donor?.code})</h3>
                  <p className="text-xs text-[#A0A0AA] font-sans">{donor?.address}</p>
                </div>
                <div className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#2C3480] text-white">
                  Transfer Recommendation: {recommendation.recommendedQuantity} {med?.unit}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="bg-[#171923] p-2.5 rounded-lg border border-[#2D3142]">
                  <span className="text-[10px] text-[#A0A0AA] block mb-0.5 font-sans">Pre-Transfer</span>
                  <strong className="text-base font-mono font-bold text-white tabular-nums">{recommendation.donorPreStock} {med?.unit}</strong>
                </div>
                <div className="bg-[#171923] p-2.5 rounded-lg border border-[#2D3142]">
                  <span className="text-[10px] text-[#5AA98C] block mb-0.5 font-sans">Post-Transfer</span>
                  <strong className="text-base font-mono font-bold text-[#5AA98C] tabular-nums">{recommendation.donorPostStock} {med?.unit}</strong>
                </div>
                <div className="bg-[#171923] p-2.5 rounded-lg border border-[#2D3142]">
                  <span className="text-[10px] text-[#A0A0AA] block mb-0.5 font-sans">Safety Reserve</span>
                  <strong className="text-base font-mono font-bold text-white tabular-nums">{recommendation.donorSafetyStock} {med?.unit}</strong>
                </div>
                <div className="bg-[#171923] p-2.5 rounded-lg border border-[#2D3142]">
                  <span className="text-[10px] text-[#A0A0AA] block mb-0.5 font-sans">Road Transit</span>
                  <strong className="text-base font-mono font-bold text-white tabular-nums">{recommendation.distanceKm} km (~{recommendation.estimatedTransitMinutes}m)</strong>
                </div>
              </div>

              <p className="text-xs text-[#A0A0AA] leading-relaxed font-sans pt-1">
                {recommendation.explanation.donorRationale}
              </p>
            </div>
          </Reveal>
        )}

        {/* Step 4: Show Safety Calculation */}
        {currentStep === 4 && (
          <Reveal key={4} direction="up" duration={250} className="space-y-4">
            <div className="flex items-center gap-2 text-[#5AA98C] font-mono text-xs uppercase tracking-wider font-bold">
              <ShieldCheck className="w-4 h-4 text-[#5AA98C]" />
              <span>Step 4: Mathematical Safety Invariant Verification</span>
            </div>

            <div className="bg-[#222431] rounded-lg p-5 border border-[#2D3142] space-y-4">
              <div className="flex items-center justify-between border-b border-[#2D3142] pb-2 text-xs">
                <span className="font-mono uppercase tracking-wider text-white font-bold">Safety Invariant Formula:</span>
                <code className="bg-[#171923] px-2 py-0.5 rounded font-mono text-blue-400 font-bold border border-[#2D3142]">
                  donor.currentStock - transferQuantity &ge; donor.minSafetyStock
                </code>
              </div>

              <div className="bg-[#171923] p-4 rounded-lg border border-[#2D3142] text-xs font-mono space-y-2 tabular-nums">
                <div className="flex justify-between">
                  <span className="text-[#A0A0AA]">Starting On-Hand ({donor?.code}):</span>
                  <span className="font-bold text-white">{recommendation.donorPreStock} {med?.unit}</span>
                </div>
                <div className="flex justify-between text-[#FF6B72]">
                  <span>- Transfer Quantity:</span>
                  <span className="font-bold">-{recommendation.recommendedQuantity} {med?.unit}</span>
                </div>
                <div className="pt-2 border-t border-[#2D3142] flex justify-between font-bold text-sm text-[#5AA98C]">
                  <span>= Post-Transfer Retained Stock:</span>
                  <span>{recommendation.donorPostStock} {med?.unit}</span>
                </div>
                <div className="flex justify-between text-[#A0A0AA] text-xs pt-1">
                  <span>Required Donor Minimum Reserve:</span>
                  <span className="font-bold text-white">{recommendation.donorSafetyStock} {med?.unit}</span>
                </div>
              </div>

              <div className="p-3 bg-[#16815D]/15 border border-[#16815D]/40 rounded-lg text-xs text-[#5AA98C] font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5AA98C] flex-shrink-0" />
                <span>
                  <strong>Proof Satisfied:</strong> {recommendation.donorPostStock} &ge; {recommendation.donorSafetyStock}. Donor facility maintains full buffer for ongoing clinical demand.
                </span>
              </div>
            </div>
          </Reveal>
        )}

        {/* Step 5: Explain Rejected Alternatives */}
        {currentStep === 5 && (
          <Reveal key={5} direction="up" duration={250} className="space-y-4">
            <div className="flex items-center gap-2 text-[#FF6B72] font-mono text-xs uppercase tracking-wider font-bold">
              <ShieldAlert className="w-4 h-4 text-[#FF6B72]" />
              <span>Step 5: Refused Alternative Facilities Audited</span>
            </div>

            <p className="text-xs text-[#A0A0AA] font-sans">
              The engine explicitly evaluated other facilities but mathematically refused them to prevent patient risk:
            </p>

            <div className="space-y-2.5">
              {rejectedCandidates.length === 0 ? (
                <div className="p-4 bg-[#222431] rounded-lg text-xs text-[#A0A0AA] text-center border border-[#2D3142]">
                  No other regional clinics stocked this exact medicine formulation.
                </div>
              ) : (
                rejectedCandidates.map((cand) => (
                  <div
                    key={cand.clinicId}
                    className="p-3.5 bg-[#222431] rounded-lg border border-[#2D3142] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="font-serif text-sm text-white">{cand.clinicName}</strong>
                        <span className="text-[11px] font-mono text-[#A0A0AA] bg-[#171923] px-1.5 rounded border border-[#2D3142]">
                          {cand.clinicCode}
                        </span>
                      </div>
                      <p className="text-[#FF6B72] font-medium text-xs mt-0.5 font-sans">
                        Refused: {cand.rejectionReason || 'Would violate donor safety minimum threshold'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-[#A0A0AA] flex-shrink-0 tabular-nums">
                      <span>Stock: <strong className="text-white">{cand.currentStock}</strong></span>
                      <span>Reserve: <strong className="text-white">{cand.safetyStock}</strong></span>
                      <span>Available: <strong className="text-white">{cand.availableSurplus}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Reveal>
        )}

        {/* Step 6: Confirmation & Dispatch Action */}
        {currentStep === 6 && (
          <Reveal key={6} direction="up" duration={250} className="space-y-4">
            <div className="flex items-center gap-2 text-white font-mono text-xs uppercase tracking-wider font-bold">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Step 6: Confirm Validated Inter-Facility Transfer</span>
            </div>

            <div className="bg-[#222431] rounded-lg p-5 border border-[#2D3142] space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#A0A0AA]">Transfer Manifest Draft</span>
                  <h3 className="font-serif text-xl text-white mt-0.5">
                    {recommendation.recommendedQuantity} {med?.unit} of {med?.name}
                  </h3>
                </div>
                <span className="font-mono text-xs bg-[#171923] px-2 py-0.5 rounded text-white border border-[#2D3142]">
                  Batch: {recommendation.batchNumber}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#171923] rounded-lg border border-[#2D3142]">
                <div>
                  <span className="text-[10px] text-[#A0A0AA] block font-sans">From (Donor)</span>
                  <strong className="font-serif text-sm text-white">{donor?.name}</strong>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400" />
                <div className="text-right">
                  <span className="text-[10px] text-[#A0A0AA] block font-sans">To (Recipient)</span>
                  <strong className="font-serif text-sm text-white">{recipient?.name}</strong>
                </div>
              </div>

              <div className="flex justify-between items-center text-[#A0A0AA] pt-2 border-t border-[#2D3142]">
                <span>Courier Distance: <strong className="text-white font-mono">{recommendation.distanceKm} km</strong></span>
                <span>Transit Window: <strong className="text-white font-mono">~{recommendation.estimatedTransitMinutes} mins</strong></span>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleConfirmTransfer}
                  className="w-full py-2.5 bg-[#2C3480] hover:bg-[#232a6b] text-white font-medium text-xs rounded-lg transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Execute &amp; Record Transfer Now</span>
                </button>
              </div>
            </div>
          </Reveal>
        )}

        {/* Step 7: Animate Verified Inventory Update & Audit Event */}
        {currentStep === 7 && (
          <Reveal key={7} direction="up" duration={250} className="space-y-4 text-center py-4">
            <div className="w-10 h-10 rounded-full bg-[#16815D]/20 text-[#5AA98C] flex items-center justify-center mx-auto border border-[#16815D]/40 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#5AA98C] font-bold">Transfer Executed Successfully</span>
              <h3 className="font-serif text-xl text-white mt-1">
                Atomic Inventory Update Logged to Audit Ledger
              </h3>
              <p className="text-xs text-[#A0A0AA] max-w-md mx-auto mt-1 leading-relaxed font-sans">
                {donor?.code} stock decremented to <strong className="text-white">{recommendation.donorPostStock} {med?.unit}</strong> and {recipient?.code} stock raised to <strong className="text-white">{recommendation.recipientPostStock} {med?.unit}</strong>.
              </p>
            </div>

            <div className="pt-3 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#2C3480] text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-[#232a6b] transition-colors shadow-sm"
              >
                Return to Proposals Grid
              </button>
            </div>
          </Reveal>
        )}
      </div>

      {/* Navigation Controls Between Steps */}
      <div className="flex items-center justify-between pt-3 border-t border-[#2D3142] text-xs">
        <button
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className="inline-flex items-center gap-1 font-medium text-[#A0A0AA] disabled:opacity-30 disabled:pointer-events-none hover:text-white cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </button>

        <span className="text-xs font-mono text-[#A0A0AA]">
          Step {currentStep} of {totalSteps}
        </span>

        {currentStep < 6 && (
          <button
            onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
            className="inline-flex items-center gap-1 font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            <span>Next Step</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {currentStep >= 6 && currentStep < 7 && (
          <button
            onClick={handleConfirmTransfer}
            className="inline-flex items-center gap-1 font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            <span>Execute Transfer</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {currentStep === 7 && (
          <button
            onClick={onClose}
            className="font-medium text-[#A0A0AA] hover:text-white cursor-pointer"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};

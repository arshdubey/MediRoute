import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PRESET_EMERGENCY_SCENARIOS } from '../../data/seedData';
import {
  Flame,
  ShieldAlert,
  RotateCcw,
  ArrowRight,
  Check,
  X,
  PlayCircle,
} from 'lucide-react';
import { Reveal } from '../motion/Reveal';

interface EmergencyViewProps {
  onNavigateToRedistribution: () => void;
}

export const EmergencyView: React.FC<EmergencyViewProps> = ({ onNavigateToRedistribution }) => {
  const {
    clinics,
    medicines,
    activeEmergency,
    triggerEmergency,
    triggerCustomEmergency,
    resolveEmergency,
    activeRecommendations,
    acceptRecommendation,
    rejectRecommendation,
    enrichedStock,
    openMatchDonorModal,
  } = useApp();

  const [customClinicId, setCustomClinicId] = useState<string>(clinics[1]?.id || 'c2');
  const [customMedicineId, setCustomMedicineId] = useState<string>(medicines[2]?.id || 'm3'); // default Epinephrine
  const [customSurgeFactor, setCustomSurgeFactor] = useState<number>(4.0);

  const emergencyRecommendations = activeRecommendations.filter(
    (r) =>
      r.urgency === 'CRITICAL' ||
      (activeEmergency && (r.recipientClinicId === activeEmergency.targetClinicId || r.urgency === 'HIGH'))
  );

  const activeClinic = activeEmergency
    ? clinics.find((c) => c.id === activeEmergency.targetClinicId)
    : null;

  const handleCustomSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    triggerCustomEmergency(customClinicId, customMedicineId, customSurgeFactor);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Reveal>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#2D3142]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#BB232B] inline-block animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF6B72] font-bold">
                Section 04 • Crisis Protocol &amp; Contingency
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-white tracking-tight font-normal">
              Emergency Surge Operations
            </h1>
            <p className="text-xs sm:text-sm text-[#A0A0AA] mt-1 max-w-2xl font-sans leading-relaxed">
              Rapid triage reallocation engine for sudden epidemiological outbreaks, mass casualty influxes, or acute regional supply collapse.
            </p>
          </div>

          {activeEmergency && (
            <button
              onClick={resolveEmergency}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#FF6B72] bg-[#BB232B]/15 hover:bg-[#BB232B]/25 rounded-lg transition-colors cursor-pointer border border-[#BB232B]/40 self-start sm:self-auto font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BB232B] focus-visible:ring-offset-1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#FF6B72]" />
              <span>Stand Down Incident</span>
            </button>
          )}
        </div>
      </Reveal>

      {/* Mandatory Regulatory & Simulation Disclaimer */}
      <Reveal delay={40}>
        <div className="bg-[#171923] rounded-lg border border-[#2D3142] p-4 sm:p-5 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-[#222431] border border-[#2D3142] flex items-center justify-center flex-shrink-0 text-[#A0A0AA]">
            <ShieldAlert className="w-4 h-4 text-[#A0A0AA]" />
          </div>
          <div className="text-xs text-[#A0A0AA] leading-relaxed font-sans">
            <strong className="text-white font-semibold block mb-0.5 font-mono uppercase tracking-wider text-[11px]">
              Simulation Integrity Protocol
            </strong>
            All scenarios, patient surges, and supply deficits simulated herein utilize fictional parameters. MediRoute does not interface with municipal emergency broadcast systems, 911/112 CAD systems, or live blue-light courier networks.
          </div>
        </div>
      </Reveal>

      {/* Interactive Custom Emergency Simulator */}
      <Reveal delay={80}>
        <div className="bg-[#171923] rounded-lg p-5 sm:p-6 border border-[#2D3142] shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#2D3142]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#BB232B]/20 flex items-center justify-center text-[#FF6B72] border border-[#BB232B]/40">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <h2 className="font-serif text-lg text-white font-normal">
                Interactive Surge Simulator
              </h2>
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF6B72] font-bold">
              Simulate Outbreak
            </span>
          </div>
          <p className="text-xs text-[#A0A0AA] mb-4 font-sans leading-relaxed">
            Select any regional clinic and essential drug to simulate sudden acute intake demand, instantly recomputing zero-violation redistribution transfers.
          </p>

          <form onSubmit={handleCustomSimulate} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A0A0AA] mb-1.5 font-medium">Target Facility</label>
              <select
                value={customClinicId}
                onChange={(e) => setCustomClinicId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-[#2D3142] rounded-lg bg-[#222431] font-medium text-white focus:outline-none focus:border-[#2C3480] focus:ring-1 focus:ring-[#2C3480] cursor-pointer"
              >
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A0A0AA] mb-1.5 font-medium">Critical Drug</label>
              <select
                value={customMedicineId}
                onChange={(e) => setCustomMedicineId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-[#2D3142] rounded-lg bg-[#222431] font-medium text-white focus:outline-none focus:border-[#2C3480] focus:ring-1 focus:ring-[#2C3480] cursor-pointer"
              >
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.dosageForm})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A0A0AA] mb-1.5 font-medium">Demand Multiplier</label>
              <select
                value={customSurgeFactor}
                onChange={(e) => setCustomSurgeFactor(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-[#2D3142] rounded-lg bg-[#222431] font-medium text-white focus:outline-none focus:border-[#2C3480] focus:ring-1 focus:ring-[#2C3480] cursor-pointer"
              >
                <option value="2.5">2.5x Normal Daily Burn</option>
                <option value="4.0">4.0x Critical Surge</option>
                <option value="6.0">6.0x Mass Casualty Surge</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 px-3 text-xs font-medium text-white bg-[#BB232B] hover:bg-[#9a1d24] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BB232B] focus-visible:ring-offset-2"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Simulate Emergency</span>
              </button>
            </div>
          </form>
        </div>
      </Reveal>

      {/* Active Incident Banner (if running) */}
      {activeEmergency && activeClinic && (
        <Reveal delay={100}>
          <div className="bg-[#080808] text-white rounded-lg p-5 sm:p-6 border border-[#BB232B] shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#BB232B]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-[#BB232B]/20 text-[#FF6B72] text-xs font-mono font-bold uppercase tracking-wider border border-[#BB232B]/40 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#BB232B] animate-pulse inline-block"></span>
                  Active Incident in Progress
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal">
                  {activeEmergency.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#E5E5E8] mt-1 max-w-2xl leading-relaxed font-sans">
                  {activeEmergency.description}
                </p>
              </div>

              <div className="bg-[#171923] p-3.5 rounded-lg border border-[#2D3142] text-xs space-y-1.5 flex-shrink-0 font-mono">
                <div className="flex justify-between gap-4">
                  <span className="text-[#A0A0AA] font-sans">Target Facility:</span>
                  <strong className="text-white">{activeClinic.name} ({activeClinic.code})</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#A0A0AA] font-sans">Surge Multiplier:</span>
                  <strong className="text-[#FF6B72] font-bold">{activeEmergency.surgeMultiplier}x baseline burn</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#A0A0AA] font-sans">Priority Route:</span>
                  <strong className="text-white">Expedited Transit (~35% faster)</strong>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* Pre-Configured Scenario Cards */}
      <Reveal delay={120}>
        <div className="space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#A0A0AA] font-bold">
            Pre-Configured Regional Scenarios
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRESET_EMERGENCY_SCENARIOS.map((scenario) => {
              const targetClinic = clinics.find((c) => c.id === scenario.targetClinicId);
              const isCurrentlyActive = activeEmergency?.id === scenario.id;

              return (
                <div
                  key={scenario.id}
                  className={`bg-[#171923] rounded-lg p-5 transition-colors flex flex-col justify-between shadow-sm border ${
                    isCurrentlyActive
                      ? 'border-[#BB232B] ring-1 ring-[#BB232B] bg-[#BB232B]/10'
                      : 'border-[#2D3142] hover:border-[#2C3480]/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF6B72] bg-[#BB232B]/20 px-1.5 py-0.5 rounded font-bold border border-[#BB232B]/40">
                        {scenario.severity} Priority
                      </span>
                      <span className="font-mono font-bold text-white bg-[#222431] px-2 py-0.5 rounded border border-[#2D3142]">{targetClinic?.code}</span>
                    </div>

                    <h3 className="font-serif text-base text-white mt-1 font-normal">{scenario.title}</h3>
                    <p className="text-xs text-[#A0A0AA] mt-1.5 leading-relaxed font-sans">
                      {scenario.description}
                    </p>

                    <div className="mt-3.5 pt-3 border-t border-[#2D3142] text-xs text-[#A0A0AA] space-y-1">
                      <div>
                        <span className="text-[#A0A0AA]">Categories:</span>{' '}
                        <strong className="text-white font-sans">{scenario.affectedCategories.join(', ')}</strong>
                      </div>
                      <div>
                        <span className="text-[#A0A0AA]">Demand Shock:</span>{' '}
                        <strong className="text-[#FF6B72] font-mono font-bold">+{Math.round((scenario.surgeMultiplier - 1) * 100)}% surge</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#2D3142]">
                    {isCurrentlyActive ? (
                      <button
                        onClick={resolveEmergency}
                        className="w-full py-2 text-xs font-medium text-[#FF6B72] bg-[#222431] hover:bg-[#BB232B]/20 border border-[#BB232B]/40 rounded-lg transition-colors cursor-pointer font-sans"
                      >
                        Stand Down Incident
                      </button>
                    ) : (
                      <button
                        onClick={() => triggerEmergency(scenario.id)}
                        className="w-full py-2 text-xs font-medium text-white bg-[#2C3480] hover:bg-[#232a6b] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 font-sans shadow-md active:scale-95"
                      >
                        <PlayCircle className="w-3.5 h-3.5 text-white" />
                        <span>Simulate Incident</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* Expedited Emergency Reallocations */}
      <Reveal delay={140}>
        <div className="bg-[#171923] rounded-lg p-5 sm:p-6 shadow-sm border border-[#2D3142] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2D3142]">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#FF6B72] font-bold mb-0.5">
                High-Priority Directives
              </div>
              <h3 className="font-serif text-lg text-white">
                Expedited Emergency Transfer Dispatch
              </h3>
              <p className="text-xs text-[#A0A0AA] font-sans">
                Priority transfers calculated to sustain vital life-support inventory (Confirm or Reject directly)
              </p>
            </div>

            <button
              onClick={onNavigateToRedistribution}
              className="text-xs font-medium text-blue-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors font-sans"
            >
              <span>Redistribution Hub</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
            </button>
          </div>

          {emergencyRecommendations.length === 0 ? (
            <div className="py-8 text-center text-[#A0A0AA] text-xs font-sans">
              No active emergency transfers required at this moment. Trigger an emergency shortage above to simulate surge demand.
            </div>
          ) : (
            <div className="space-y-3">
              {emergencyRecommendations.map((rec) => {
                const med = medicines.find((m) => m.id === rec.medicineId);
                const donor = clinics.find((c) => c.id === rec.donorClinicId);
                const recipient = clinics.find((c) => c.id === rec.recipientClinicId);

                const recStock = enrichedStock.find(
                  (s) => s.clinicId === rec.recipientClinicId && s.medicineId === rec.medicineId
                );

                return (
                  <div
                    key={rec.id}
                    className="bg-[#222431] rounded-lg p-4 sm:p-5 border border-[#BB232B]/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#BB232B] text-white uppercase tracking-wider">
                          Expedited
                        </span>
                        <span className="font-serif text-base text-white">
                          {rec.recommendedQuantity} {med?.unit} of {med?.name}
                        </span>
                      </div>

                      <div className="text-xs text-[#A0A0AA] mt-1 flex flex-wrap items-center gap-1.5 font-sans">
                        <span className="font-semibold text-white">{donor?.name} ({donor?.code})</span>
                        <ArrowRight className="w-3 h-3 text-[#A0A0AA]" />
                        <span className="font-semibold text-white">{recipient?.name} ({recipient?.code})</span>
                        <span className="text-[#2D3142]">•</span>
                        <span className="text-[#FF6B72] font-mono font-bold">
                          ~{rec.estimatedTransitMinutes} mins expedited ({rec.distanceKm} km)
                        </span>
                      </div>

                      <p className="text-xs text-[#A0A0AA] mt-1.5 leading-relaxed font-sans">
                        {rec.explanation.summary}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-auto font-sans">
                      {recStock && (
                        <button
                          onClick={() => openMatchDonorModal(recStock)}
                          className="px-3 py-1 text-xs font-medium text-white bg-[#171923] hover:bg-[#2D3142] rounded-lg border border-[#2D3142] transition-colors cursor-pointer shadow-sm"
                          title="Inspect candidate facilities"
                        >
                          Inspect
                        </button>
                      )}

                      <button
                        onClick={() => rejectRecommendation(rec.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#A0A0AA] hover:text-white hover:bg-[#171923] transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => acceptRecommendation(rec.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-[#BB232B] hover:bg-[#9a1d24] rounded-lg shadow-sm transition-colors cursor-pointer active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { EnrichedStockItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { Reveal, AnimatedNumber, StaggerGroup, useInView } from '../motion';
import { RegionalNetworkMap } from './RegionalNetworkMap';
import {
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Sparkles,
  PlayCircle,
  ArrowUpRight,
  CalendarClock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { calculateClinicSummaries } from '../../services/analyticsService';
import { calculateRecipientTargetNeed } from '../../services/redistributionEngine';

interface DashboardViewProps {
  onNavigateToTab: (tab: 'inventory' | 'forecasting' | 'redistribution' | 'emergency' | 'analytics' | 'expiry') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToTab }) => {
  const {
    clinics,
    medicines,
    stockRecords,
    enrichedStock,
    activeRecommendations,
    fefoRecommendations,
    transfers,
    impactMetrics,
    selectedClinicId,
    setSelectedClinicId,
    activeEmergency,
    openMatchDonorModal,
    matchDonorForRecord,
    runGuidedDemoScenario,
  } = useApp();

  const [hoveredDeficitItem, setHoveredDeficitItem] = useState<EnrichedStockItem | null>(null);

  // Derive focused corridor on the regional map when hovering or focusing an item in the triage queue
  const focusedCorridor = useMemo(() => {
    if (!hoveredDeficitItem) return null;
    const existingRec = activeRecommendations.find(
      (r) =>
        r.medicineId === hoveredDeficitItem.medicineId &&
        r.recipientClinicId === hoveredDeficitItem.clinicId
    );
    if (existingRec) {
      return {
        donorClinicId: existingRec.donorClinicId,
        recipientClinicId: existingRec.recipientClinicId,
        medicineName: hoveredDeficitItem.medicine.name,
        recommendedQuantity: existingRec.recommendedQuantity,
      };
    }
    const { recommendation } = matchDonorForRecord(hoveredDeficitItem);
    if (recommendation) {
      return {
        donorClinicId: recommendation.donorClinicId,
        recipientClinicId: recommendation.recipientClinicId,
        medicineName: hoveredDeficitItem.medicine.name,
        recommendedQuantity: recommendation.recommendedQuantity,
      };
    }
    return null;
  }, [hoveredDeficitItem, activeRecommendations, matchDonorForRecord]);

  // Filter stock if a single clinic is selected in navbar
  const filteredStock = useMemo(() => {
    if (selectedClinicId === 'ALL') return enrichedStock;
    return enrichedStock.filter((s) => s.clinicId === selectedClinicId);
  }, [enrichedStock, selectedClinicId]);

  // Aggregate stats
  const stats = useMemo(() => {
    let criticalCount = 0;
    let lowStockCount = 0;
    let surplusCount = 0;
    let expiringCount = 0;
    let optimalCount = 0;

    for (const item of filteredStock) {
      if (item.calc.status === 'CRITICAL') criticalCount++;
      else if (item.calc.status === 'LOW_STOCK') lowStockCount++;
      else if (item.calc.status === 'SURPLUS') surplusCount++;
      else if (item.calc.status === 'EXPIRING_SOON') expiringCount++;
      else optimalCount++;
    }

    return {
      totalMedicines: filteredStock.length,
      criticalCount,
      lowStockCount,
      surplusCount,
      expiringCount,
      optimalCount,
    };
  }, [filteredStock]);

  // Clinic health summary for bar chart
  const clinicSummaries = useMemo(() => {
    return calculateClinicSummaries(clinics, stockRecords);
  }, [clinics, stockRecords]);

  // Luxury healthcare chart palette - strictly unified with status badges
  const pieData = [
    { name: 'Optimal', value: stats.optimalCount, color: '#16815D' },
    { name: 'Surplus', value: stats.surplusCount, color: '#2C3480' },
    { name: 'Low Stock', value: stats.lowStockCount, color: '#B87A14' },
    { name: 'Critical', value: stats.criticalCount, color: '#BB232B' },
    { name: 'Expiring Soon', value: stats.expiringCount, color: '#737373' },
  ].filter((d) => d.value > 0);

  // Top critical shortages requiring immediate reallocation
  const criticalItems = useMemo(() => {
    return filteredStock
      .filter((s) => s.calc.status === 'CRITICAL' || s.calc.status === 'LOW_STOCK')
      .sort((a, b) => a.calc.daysUntilStockout - b.calc.daysUntilStockout)
      .slice(0, 5);
  }, [filteredStock]);

  // Dynamically derive the benchmark Case Study metrics directly from the authoritative redistribution engine
  const caseStudyScenario = useMemo(() => {
    const stJudeEpi = stockRecords.find(
      (s) => s.clinicId === 'c2' && s.medicineId === 'm3'
    );
    const northsideEpi = stockRecords.find(
      (s) => s.clinicId === 'c4' && s.medicineId === 'm3'
    );
    const metroHopeEpi = stockRecords.find(
      (s) => s.clinicId === 'c1' && s.medicineId === 'm3'
    );

    if (!stJudeEpi || !northsideEpi) return null;

    // Check if the transfer has already been executed in the session audit ledger
    const completedTransfer = transfers.find(
      (t) => t.recipientClinicId === 'c2' && t.medicineId === 'm3'
    );
    const isTransferred = !!completedTransfer;

    // Determine baseline pre-transfer state
    const baselineStJude = isTransferred
      ? { ...stJudeEpi, currentStock: Math.max(0, stJudeEpi.currentStock - completedTransfer.quantity) }
      : stJudeEpi;

    const { immediateDeficit, targetNeed } = calculateRecipientTargetNeed(baselineStJude);
    const transferQty = completedTransfer ? completedTransfer.quantity : targetNeed;

    // Donor calculations
    const donorCurrent = northsideEpi.currentStock;
    const donorSafety = northsideEpi.minSafetyStock;
    const donorPreStock = isTransferred ? donorCurrent + transferQty : donorCurrent;
    const donorPostStock = isTransferred ? donorCurrent : donorCurrent - transferQty;
    const donorSurplus = Math.max(0, donorPreStock - donorSafety);
    const donorRemainingBuffer = Math.max(0, donorPostStock - donorSafety);

    // Recipient calculations
    const recipientCurrent = stJudeEpi.currentStock;
    const recipientSafety = stJudeEpi.minSafetyStock;
    const recipientPreStock = isTransferred ? recipientCurrent - transferQty : recipientCurrent;
    const recipientPostStock = isTransferred ? recipientCurrent : recipientCurrent + transferQty;
    const recipientPreDays = (recipientPreStock / (stJudeEpi.avgDailyConsumption || 1)).toFixed(1);
    const recipientPostDays = (recipientPostStock / (stJudeEpi.avgDailyConsumption || 1)).toFixed(1);

    // Rejected candidate (Metro Hope MHG)
    const mhCurrent = metroHopeEpi?.currentStock || 52;
    const mhSafety = metroHopeEpi?.minSafetyStock || 50;
    const mhSurplus = Math.max(0, mhCurrent - mhSafety);
    const mhPostStock = mhCurrent - transferQty;
    const mhBreach = Math.max(0, mhSafety - mhPostStock);

    return {
      isTransferred,
      transferQty,
      immediateDeficit,
      targetNeed,
      donorClinicName: 'Northside Urgent Care',
      donorCode: 'NUC',
      donorPreStock,
      donorPostStock,
      donorSafety,
      donorSurplus,
      donorRemainingBuffer,
      recipientClinicName: 'St. Jude Community Health',
      recipientCode: 'SJC',
      recipientPreStock,
      recipientPostStock,
      recipientSafety,
      recipientPreDays,
      recipientPostDays,
      rejectedName: 'Metro Hope General',
      rejectedCode: 'MHG',
      rejectedStock: mhCurrent,
      rejectedSafety: mhSafety,
      rejectedSurplus: mhSurplus,
      rejectedPostStock: mhPostStock,
      rejectedBreach: mhBreach,
    };
  }, [stockRecords, transfers]);

  // Viewport trigger for charts - ensures animations only run when scrolled into view
  const [chartsRef, areChartsInView] = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <div className="space-y-6">
      {/* 1. Luxury Editorial Opening Viewport (Cobalt & Pure White Harmony) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Expressive Editorial Command Heading */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 sm:p-6 border border-[#E5E5E8] flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#BB232B] inline-block" />
                <span className="text-[10px] font-mono font-semibold tracking-widest uppercase text-[#737373]">
                  REGIONAL HEALTH / OPERATIONS 01
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#080808] font-serif leading-[1.08]">
                Medicine, where it matters.
              </h1>
            </div>

            <p className="text-[#737373] text-xs sm:text-sm leading-relaxed font-sans max-w-xl">
              Continuous inventory monitoring across 5 interconnected regional facilities. Deterministic redistribution matching algorithms calculate safe surplus allocations while strictly preserving donor safety reserves.
            </p>

            {/* Subordinate Context & Network Metadata Line */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#737373] font-mono pt-1">
              <span className="flex items-center gap-1.5 text-[#080808] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16815D]" />
                <span>5 Connected Facilities</span>
              </span>
              <span className="text-[#E5E5E8]">•</span>
              <span>Surplus-to-Deficit Routing</span>
              <span className="text-[#E5E5E8]">•</span>
              <span className="text-[#737373]">Dynamic Safety Buffer</span>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-[#E5E5E8] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onNavigateToTab('redistribution')}
                className="bg-[#2C3480] hover:bg-[#232A6B] text-[#FFFFFF] font-semibold text-xs px-4 py-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95 shadow-sm border border-[#2C3480] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480] focus-visible:ring-offset-2"
              >
                <span className="text-[#FFFFFF]">Redistribution Proposals</span>
                <span className="bg-[#BB232B] text-[#FFFFFF] px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold tabular-nums">
                  {activeRecommendations.length}
                </span>
              </button>

              <button
                onClick={() => onNavigateToTab('forecasting')}
                className="bg-[#FFFFFF] hover:bg-[#F5F5F7] text-[#080808] font-semibold text-xs px-3.5 py-2.5 rounded-lg border border-[#E5E5E8] hover:border-[#2C3480] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480] focus-visible:ring-offset-2"
              >
                Depletion Runways
              </button>

              <button
                onClick={() => onNavigateToTab('expiry')}
                className="bg-[#FFFFFF] hover:bg-[#F5F5F7] text-[#080808] font-semibold text-xs px-3.5 py-2.5 rounded-lg border border-[#E5E5E8] hover:border-[#2C3480] transition-all cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480] focus-visible:ring-offset-2"
              >
                <CalendarClock className="w-3.5 h-3.5 text-[#2C3480]" />
                <span>Expiry Intelligence</span>
                {fefoRecommendations.length > 0 && (
                  <span className="bg-[#2C3480] text-white px-1.5 py-0.2 rounded-md text-[10px] font-mono">
                    {fefoRecommendations.length}
                  </span>
                )}
              </button>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs text-[#16815D] font-medium px-2.5 py-1.5 bg-[#F0F8F5] border border-[#BFDFD2] rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16815D] flex-shrink-0" />
              <span className="font-sans text-[11px] font-semibold">Zero-Breach Enforced</span>
            </div>
          </div>
        </div>

        {/* Right Column: Custom Regional Network Visualization */}
        <div className="lg:col-span-5 h-full">
          <RegionalNetworkMap
            clinics={clinics}
            enrichedStock={enrichedStock}
            activeRecommendations={activeRecommendations}
            activeEmergency={activeEmergency}
            transfers={transfers}
            focusedCorridor={focusedCorridor}
            selectedClinicId={selectedClinicId}
            onSelectClinic={(clinicId) => {
              setSelectedClinicId(selectedClinicId === clinicId ? 'ALL' : clinicId);
            }}
          />
        </div>
      </div>

      {/* 2. Editorial Metric Composition (Dominant Critical Metric + Supporting Matrix) */}
      <div className="bg-white rounded-xl border border-[#E5E5E8] shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E5E5E8]">
          {/* Dominant Critical-Shortage Metric */}
          <div className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between bg-[#FFFFFF]">
            <Reveal delay={100} duration={400} direction="up" className="flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#737373]">
                    NETWORK SHORTAGES
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      stats.criticalCount > 0
                        ? 'bg-[#FDF3F3] text-[#BB232B] border border-[#F5CACD]'
                        : 'bg-[#F0F8F5] text-[#16815D] border border-[#BFDFD2]'
                    }`}
                  >
                    {stats.criticalCount > 0 ? (
                      <>
                        <AlertTriangle className="w-3 h-3 text-[#BB232B]" />
                        <span>Action Required</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3 text-[#16815D]" />
                        <span>All Safe</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="my-2">
                  <div
                    className={`text-4xl sm:text-5xl font-normal font-serif tracking-tight tabular-nums ${
                      stats.criticalCount > 0 ? 'text-[#BB232B]' : 'text-[#080808]'
                    }`}
                  >
                    <AnimatedNumber value={stats.criticalCount} />
                  </div>
                  <h3 className="text-sm font-semibold text-[#080808] mt-1 font-sans">
                    Critical Deficit Instances
                  </h3>
                  <p className="text-xs text-[#737373] mt-1 leading-relaxed font-sans max-w-sm">
                    {stats.criticalCount > 0
                      ? 'Essential formulary lines holding ≤ 2.5 days of clinical coverage at current burn rate.'
                      : 'All 5 network facilities currently maintain stock above required minimum reserve buffers.'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E5E8] mt-3">
                {stats.criticalCount > 0 ? (
                  <button
                    onClick={() => onNavigateToTab('redistribution')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#BB232B] hover:text-[#A01B22] hover:underline cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BB232B] rounded"
                  >
                    <span>Initiate algorithmic redistribution</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs text-[#16815D] font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Network inventory balanced
                  </span>
                )}
              </div>
            </Reveal>
          </div>

          {/* Supporting Metrics 2x2 Grid (Consistent Internal Padding, Aligned Rows) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E5E8]">
            {/* Supporting 1: Available Donor Surplus */}
            <div className="p-5 sm:p-6 flex flex-col justify-between bg-white">
              <Reveal delay={150} duration={400} direction="up" className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#737373]">
                      DONOR SURPLUS
                    </span>
                    <span className="text-[10px] font-mono text-[#2C3480] bg-[#F0F1FA] px-1.5 py-0.5 rounded border border-[#C7CAEB] font-bold">
                      Eligible Donors
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-normal font-serif text-[#2C3480] tabular-nums my-1">
                    <AnimatedNumber value={stats.surplusCount} />
                  </div>
                  <p className="text-xs text-[#737373] font-sans leading-relaxed">
                    Surplus stock batches safely transferable above donor safety reserves.
                  </p>
                </div>
                <div className="pt-3 border-t border-[#E5E5E8] mt-3 text-xs text-[#16815D] font-medium flex items-center justify-between">
                  <span>Donor Buffer</span>
                  <span>Preserved</span>
                </div>
              </Reveal>
            </div>

            {/* Supporting 2: Clinical Formulary */}
            <div className="p-5 sm:p-6 flex flex-col justify-between bg-white">
              <Reveal delay={200} duration={400} direction="up" className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#737373]">
                      FORMULARY LINES
                    </span>
                    <span className="text-[10px] font-mono text-[#737373] bg-[#F5F5F7] px-1.5 py-0.5 rounded border border-[#E5E5E8]">
                      5 Facilities
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-normal font-serif text-[#080808] tabular-nums my-1">
                    <AnimatedNumber value={medicines.length} />
                  </div>
                  <p className="text-xs text-[#737373] font-sans leading-relaxed">
                    {filteredStock.length} monitored inventory batches with linear consumption tracking.
                  </p>
                </div>
                <div className="pt-3 border-t border-[#E5E5E8] mt-3 text-xs text-[#737373] flex items-center justify-between font-sans">
                  <span>Consumption Burn</span>
                  <span className="text-[#080808] font-medium">Active</span>
                </div>
              </Reveal>
            </div>

            {/* Supporting 3: Low-Stock Watchlist */}
            <div className="p-5 sm:p-6 flex flex-col justify-between sm:border-t border-[#E5E5E8] bg-white">
              <Reveal delay={250} duration={400} direction="up" className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#737373]">
                      LOW-STOCK WATCHLIST
                    </span>
                    <span className="text-[10px] font-mono text-[#B87A14] bg-[#FEF9EF] px-1.5 py-0.5 rounded border border-[#FAE0AD] font-bold">
                      2.5d – 5.0d
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-normal font-serif text-[#080808] tabular-nums my-1">
                    <AnimatedNumber value={stats.lowStockCount} />
                  </div>
                  <p className="text-xs text-[#737373] font-sans leading-relaxed">
                    Medicines approaching safety reserve threshold; under proactive observation.
                  </p>
                </div>
                <div className="pt-3 border-t border-[#E5E5E8] mt-3 text-xs text-[#737373] flex items-center justify-between font-sans">
                  <span>Threshold Runway</span>
                  <span className="text-[#B87A14] font-medium font-mono">Attention</span>
                </div>
              </Reveal>
            </div>

            {/* Supporting 4: Verified Dispatches */}
            <div className="p-5 sm:p-6 flex flex-col justify-between sm:border-t border-[#E5E5E8] bg-white">
              <Reveal delay={300} duration={400} direction="up" className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#737373]">
                      VERIFIED DISPATCHES
                    </span>
                    <span className="text-[10px] font-mono text-[#16815D] bg-[#F0F8F5] px-1.5 py-0.5 rounded border border-[#BFDFD2] font-bold">
                      Audit Trail
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-normal font-serif text-[#16815D] tabular-nums my-1">
                    <AnimatedNumber value={impactMetrics.completedTransfersCount} />
                  </div>
                  <p className="text-xs text-[#737373] font-sans leading-relaxed">
                    Logged transfers in immutable session audit manifest ledger.
                  </p>
                </div>
                <div className="pt-3 border-t border-[#E5E5E8] mt-3 text-xs text-[#16815D] font-medium flex items-center gap-1 font-sans">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{impactMetrics.networkSafetyComplianceRate}% Safety Compliance</span>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Luxury Black & Cobalt Case Study Section (Deterministic Allocation Verification) */}
      <Reveal direction="up" delay={80} duration={450}>
        <div className="bg-[#080808] text-[#FFFFFF] rounded-2xl p-5 sm:p-7 border border-[#2C3480]/50 shadow-2xl relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#171B42]/70 via-[#080808] to-[#080808]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4 max-w-3xl">
              <div className="w-9 h-9 rounded-lg bg-[#2C3480]/30 text-[#BB232B] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#2C3480]/60">
                <PlayCircle className="w-5 h-5 text-[#BB232B]" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#BB232B] bg-[#2C0C0E] px-2.5 py-0.5 rounded-md border border-[#BB232B]/40">
                    CASE STUDY 01 / DETERMINISTIC ALLOCATION
                  </span>
                  <span className="text-[11px] font-mono text-[#C7CAEB]">
                    Epinephrine 1 mg/mL Benchmark
                  </span>
                  <span className="text-[10px] font-mono font-medium text-[#4ADE80] bg-[#0E2A1C] border border-[#16815D]/40 px-2 py-0.5 rounded-md">
                    {caseStudyScenario?.isTransferred ? 'Dispatched to Session Ledger' : 'Zero-Breach Verified'}
                  </span>
                </div>
                <h3 className="font-serif text-lg sm:text-xl lg:text-2xl text-[#FFFFFF] font-normal tracking-tight leading-snug">
                  {caseStudyScenario?.isTransferred
                    ? `St. Jude Deficit Resolved: ${caseStudyScenario.transferQty} units transferred from Northside — Safety Reserve Preserved`
                    : `St. Jude Deficit (${caseStudyScenario?.immediateDeficit || 19}u deficit, on-hand ${caseStudyScenario?.recipientPreStock || 6}u) matched to Northside Surplus (${caseStudyScenario?.donorSurplus || 85}u available) — Unsafe Donors Refused`}
                </h3>
                <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed font-sans">
                  The allocation algorithm evaluates candidate facilities, selects <strong className="text-[#FFFFFF]">Northside Urgent Care</strong> (holds {caseStudyScenario?.donorPreStock || 115} units, preserves {caseStudyScenario?.donorSafety || 30}-unit safety reserve with +{caseStudyScenario?.donorRemainingBuffer || 51}-unit remaining buffer after transferring {caseStudyScenario?.transferQty || 34} units), and explicitly refuses <strong className="text-[#BB232B]">Metro Hope General</strong> (holds only {caseStudyScenario?.rejectedStock || 52} units with {caseStudyScenario?.rejectedSafety || 50}-unit reserve; transfer would breach reserve by {caseStudyScenario?.rejectedBreach || 32} units).
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch lg:items-center gap-2.5 flex-shrink-0">
              <button
                onClick={runGuidedDemoScenario}
                className="bg-[#2C3480] hover:bg-[#232A6B] border border-[#3D479E] text-[#FFFFFF] text-xs font-semibold px-4 py-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-md whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {caseStudyScenario?.isTransferred ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Re-Run Case Study Walkthrough</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>Launch Case Study Walkthrough</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dedicated Comparative Invariant Breakdown Matrix */}
          <div className="mt-4 pt-4 border-t border-[#2C3480]/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#121212] p-3 rounded-lg border border-[#2C3480]/40">
              <span className="text-[9px] font-mono text-[#A4AADE] uppercase tracking-wider block">Selected Safe Donor</span>
              <div className="font-semibold text-[#FFFFFF] mt-0.5 flex items-center justify-between">
                <span>{caseStudyScenario?.donorClinicName || 'Northside Urgent Care'}</span>
                <span className="text-[#4ADE80] text-[10px] font-mono font-bold bg-[#0E2A1C] px-1.5 py-0.2 rounded border border-[#16815D]/40">Approved</span>
              </div>
              <span className="text-[10px] text-[#A3A3A3] font-mono block mt-1">
                {caseStudyScenario?.donorPreStock || 115}u on-hand &rarr; {caseStudyScenario?.donorPostStock || 81}u (+{caseStudyScenario?.donorRemainingBuffer || 51}u buffer &gt; {caseStudyScenario?.donorSafety || 30}u min)
              </span>
            </div>

            <div className="bg-[#121212] p-3 rounded-lg border border-[#BB232B]/40">
              <span className="text-[9px] font-mono text-[#BB232B] uppercase tracking-wider block">Rejected Unsafe Donor</span>
              <div className="font-semibold text-[#FFFFFF] mt-0.5 flex items-center justify-between">
                <span>{caseStudyScenario?.rejectedName || 'Metro Hope General'}</span>
                <span className="text-[#BB232B] text-[10px] font-mono font-bold bg-[#2C0C0E] px-1.5 py-0.2 rounded border border-[#BB232B]/40">Refused</span>
              </div>
              <span className="text-[10px] text-[#A3A3A3] font-mono block mt-1">
                {caseStudyScenario?.rejectedStock || 52}u on-hand &rarr; {caseStudyScenario?.rejectedPostStock || 18}u ({caseStudyScenario?.rejectedBreach || 32}u breach &lt; {caseStudyScenario?.rejectedSafety || 50}u reserve)
              </span>
            </div>

            <div className="bg-[#121212] p-3 rounded-lg border border-[#2C3480]/40">
              <span className="text-[9px] font-mono text-[#A4AADE] uppercase tracking-wider block">
                {caseStudyScenario?.isTransferred ? 'Executed Dispatch' : 'Proposed Allocation'}
              </span>
              <div className="font-semibold text-[#FFFFFF] mt-0.5 flex items-center justify-between">
                <span>{caseStudyScenario?.recipientClinicName || 'St. Jude Health'}</span>
                <span className="text-[#C7CAEB] text-[10px] font-mono font-bold">
                  {caseStudyScenario?.transferQty || 34} units
                </span>
              </div>
              <span className="text-[10px] text-[#A3A3A3] font-mono block mt-1">
                Runway restored: {caseStudyScenario?.recipientPreDays || 1.2}d &rarr; {caseStudyScenario?.recipientPostDays || 8.0}d safe runway
              </span>
            </div>

            <div className="bg-[#121212] p-3 rounded-lg border border-[#16815D]/40">
              <span className="text-[9px] font-mono text-[#A4AADE] uppercase tracking-wider block">Safety Invariant Proof</span>
              <div className="font-semibold text-[#4ADE80] mt-0.5 font-mono text-[11px] flex items-center justify-between">
                <span>postStock &ge; minSafety</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
              </div>
              <span className="text-[10px] text-[#A3A3A3] font-mono block mt-1">
                {caseStudyScenario?.donorPostStock || 81} &ge; {caseStudyScenario?.donorSafety || 30} (Valid: +{caseStudyScenario?.donorRemainingBuffer || 51}u above reserve)
              </span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* 4. Main Data Visualizations: Regional Inventory Balance & Stock Health Donut */}
      <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Facility Inventory Classification Breakdown Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 sm:p-6 border border-concrete shadow-print-sm flex flex-col justify-between">
          <Reveal direction="up" delay={100} duration={450}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-concrete">
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted block mb-0.5">
                  FACILITY BALANCES
                </span>
                <h2 className="font-serif text-base text-ink font-normal">
                  Regional Facility Inventory Balance
                </h2>
                <p className="text-xs text-graphite font-sans">
                  Stock classification ratios across the 5 connected healthcare facilities
                </p>
              </div>
              <span className="text-xs font-mono text-graphite bg-paper px-2 py-0.5 rounded border border-concrete">
                5 Facilities
              </span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={clinicSummaries.map((s) => ({
                    clinicCode: s.clinic.code,
                    clinicName: s.clinic.name,
                    Optimal: s.optimalCount,
                    Surplus: s.surplusCount,
                    LowStock: s.lowStockCount,
                    Critical: s.criticalCount,
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="clinicCode"
                    tick={{ fontSize: 11, fill: '#77766F', fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#77766F', fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const clinic = clinics.find((c) => c.code === label);
                      return (
                        <div className="bg-[#080808] border border-[#2C3480]/50 rounded-lg p-3 text-[#FFFFFF] text-xs font-sans shadow-xl space-y-1.5 min-w-[180px]">
                          <div className="font-semibold text-sm border-b border-[#2C3480]/40 pb-1 font-serif text-[#FFFFFF]">
                            {clinic?.code} — {clinic?.name}
                          </div>
                          <div className="space-y-1 pt-0.5">
                            {payload.map((entry) => (
                              <div key={entry.name} className="flex items-center justify-between gap-3 text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: entry.color }} />
                                  <span className="text-[#C7CAEB]">{entry.name}:</span>
                                </div>
                                <span className="font-mono font-bold text-[#FFFFFF]">{entry.value} lines</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', fontFamily: 'Inter, sans-serif' }} />
                  <Bar dataKey="Optimal" stackId="a" fill="#16815D" isAnimationActive={areChartsInView} animationDuration={600} animationEasing="ease-out" />
                  <Bar dataKey="Surplus" stackId="a" fill="#2C3480" isAnimationActive={areChartsInView} animationDuration={600} animationEasing="ease-out" />
                  <Bar dataKey="LowStock" stackId="a" fill="#B87A14" isAnimationActive={areChartsInView} animationDuration={600} animationEasing="ease-out" />
                  <Bar dataKey="Critical" stackId="a" fill="#BB232B" radius={[2, 2, 0, 0]} isAnimationActive={areChartsInView} animationDuration={600} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Reveal>
        </div>

        {/* Network Stock Classification Ratio Donut */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-[#E5E5E8] shadow-xs flex flex-col justify-between">
          <Reveal direction="up" delay={120} duration={450}>
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#737373] block">
                  NETWORK RATIO
                </span>
                <span className="text-xs font-mono text-[#080808]">Total Lines</span>
              </div>
              <h2 className="font-serif text-base text-[#080808] font-normal">
                Stock Health Breakdown
              </h2>
              <p className="text-xs text-[#737373] font-sans mb-1">Proportion across all active batches</p>
            </div>

            <div className="h-44 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={areChartsInView}
                    animationDuration={600}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0];
                      const total = filteredStock.length || 1;
                      const pct = Math.round(((Number(data.value) || 0) / total) * 100);
                      return (
                        <div className="bg-[#080808] border border-[#2C3480]/50 rounded-lg p-2.5 text-[#FFFFFF] text-xs font-sans shadow-xl min-w-[130px]">
                          <div className="flex items-center gap-1.5 mb-1 font-semibold text-[#FFFFFF]">
                            <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: data.payload.color }} />
                            <span>{data.name}</span>
                          </div>
                          <div className="font-mono text-[11px] text-[#C7CAEB]">
                            {data.value} batches ({pct}%)
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-normal font-serif text-ink">{filteredStock.length}</span>
                <span className="text-[9px] font-mono font-medium text-muted uppercase tracking-wider">Batches</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-concrete">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-xs flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-graphite text-[11px] truncate font-sans">{d.name}</span>
                  <span className="font-mono font-bold text-ink ml-auto text-[11px] tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* 5. Shortage Deficit Triage Queue & Recent Inter-Clinic Transfers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active Deficit Triage Queue */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-concrete shadow-print-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-concrete">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-vermilion" />
                <div>
                  <h3 className="font-serif text-base text-ink font-normal">
                    Active Deficit Triage Queue
                  </h3>
                  <p className="text-[11px] text-muted font-sans">
                    Essential formulary lines holding critical coverage (Action Required)
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToTab('redistribution')}
                className="text-xs font-medium text-ink hover:underline flex items-center gap-1 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink rounded"
              >
                <span>All Proposals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {criticalItems.length === 0 ? (
                <div className="py-7 px-4 bg-paper rounded border border-concrete text-center space-y-2.5">
                  <div className="w-9 h-9 rounded-full bg-clinicalGreen/10 border border-clinicalGreen/30 text-clinicalGreen flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5 text-clinicalGreen" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-normal text-ink">
                      Regional Reserve Invariants Maintained
                    </h4>
                    <p className="text-xs text-graphite max-w-sm mx-auto mt-0.5 font-sans leading-relaxed">
                      Zero active shortages detected across monitored formulary lines. All regional facilities are currently operating at or above minimum safety thresholds.
                    </p>
                  </div>
                  <div className="pt-1.5 flex items-center justify-center gap-2">
                    <button
                      onClick={() => onNavigateToTab('inventory')}
                      className="text-[11px] font-medium text-ink bg-white px-3 py-1 rounded border border-concrete hover:bg-concrete/40 transition-colors cursor-pointer"
                    >
                      Inspect Inventory
                    </button>
                    <button
                      onClick={() => onNavigateToTab('forecasting')}
                      className="text-[11px] font-medium text-graphite bg-white px-3 py-1 rounded border border-concrete hover:text-ink hover:bg-concrete/40 transition-colors cursor-pointer"
                    >
                      View Depletion Runways
                    </button>
                  </div>
                </div>
              ) : (
                criticalItems.map((item) => (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredDeficitItem(item)}
                    onMouseLeave={() => setHoveredDeficitItem(null)}
                    onFocus={() => setHoveredDeficitItem(item)}
                    onBlur={() => setHoveredDeficitItem(null)}
                    tabIndex={0}
                    className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                      hoveredDeficitItem?.id === item.id
                        ? 'border-[#BB232B] bg-white ring-1 ring-[#BB232B]/30 shadow-xs'
                        : 'border-[#E5E5E8] bg-[#F5F5F7] hover:bg-white hover:border-[#080808]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-sm text-[#080808] truncate font-medium">
                          {item.medicine.name}
                        </span>
                        <StatusBadge status={item.calc.status} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#737373] mt-1 flex-wrap font-sans">
                        <span className="font-semibold text-[#080808]">{item.clinic.name}</span>
                        <span className="text-[#E5E5E8]">•</span>
                        <span>
                          On-Hand: <strong className="text-[#080808] font-mono">{item.currentStock}</strong> / {item.minSafetyStock} min
                        </span>
                        <span className="text-[#E5E5E8]">•</span>
                        <span className="text-[#BB232B] font-bold font-mono">
                          {item.calc.daysUntilStockout}d coverage
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => openMatchDonorModal(item)}
                      className="flex-shrink-0 bg-white hover:bg-[#2C3480] hover:text-white text-[#080808] border border-[#E5E5E8] hover:border-[#2C3480] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480]"
                      title={`Match safe donor facility for ${item.medicine.name}`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#BB232B]" />
                      <span>Match Donor</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Confirmed Inter-Clinic Transfers */}
        <div className="bg-white rounded-xl p-5 border border-[#E5E5E8] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E5E8]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#080808]" />
                <div>
                  <h3 className="font-serif text-base text-[#080808] font-normal">
                    Recent Inter-Clinic Dispatches
                  </h3>
                  <p className="text-[11px] text-[#737373] font-sans">
                    Confirmed transfers logged in immutable audit trail
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToTab('analytics')}
                className="text-xs font-semibold text-[#2C3480] hover:underline flex items-center gap-1 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2C3480] rounded"
              >
                <span>Audit Manifest</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {transfers.length === 0 ? (
                <div className="py-7 px-4 bg-[#F5F5F7] rounded-lg border border-dashed border-[#E5E5E8] text-center space-y-2.5">
                  <div className="w-9 h-9 rounded-full bg-white border border-[#E5E5E8] text-[#737373] flex items-center justify-center mx-auto">
                    <Truck className="w-4 h-4 text-[#737373]" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-normal text-[#080808]">
                      No Transfers Dispatched in Session
                    </h4>
                    <p className="text-xs text-[#737373] max-w-sm mx-auto mt-0.5 font-sans leading-relaxed">
                      Confirm an algorithmic redistribution proposal or launch the case study to log a verified dispatch into the session ledger.
                    </p>
                  </div>
                  <div className="pt-1.5 flex items-center justify-center gap-2">
                    <button
                      onClick={runGuidedDemoScenario}
                      className="text-[11px] font-medium text-white bg-[#2C3480] hover:bg-[#232A6B] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      <span>Run Case Study Scenario</span>
                    </button>
                  </div>
                </div>
              ) : (
                transfers.slice(0, 4).map((t) => {
                  const med = medicines.find((m) => m.id === t.medicineId);
                  const donor = clinics.find((c) => c.id === t.donorClinicId);
                  const recipient = clinics.find((c) => c.id === t.recipientClinicId);

                  return (
                    <div
                      key={t.id}
                      className="p-3 rounded-lg border border-[#E5E5E8] bg-[#F5F5F7] hover:bg-white hover:border-[#080808] transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-sm text-[#080808] font-medium">
                            {t.quantity} {med?.unit || 'units'} of {med?.name}
                          </span>
                          {t.isEmergency && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-vermilion/10 text-vermilion border border-vermilion/30 uppercase tracking-wider">
                              Crisis Surge
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-graphite mt-1 flex flex-wrap items-center gap-1.5 font-sans">
                          <span className="font-bold text-ink bg-white px-1.5 py-0.5 rounded text-[10px] font-mono border border-concrete">
                            {donor?.code || t.donorClinicId}
                          </span>
                          <ArrowRight className="w-3 h-3 text-muted" />
                          <span className="font-bold text-ink bg-white px-1.5 py-0.5 rounded text-[10px] font-mono border border-concrete">
                            {recipient?.code || t.recipientClinicId}
                          </span>
                          <span className="text-concrete">•</span>
                          <span className="text-graphite text-xs font-mono">
                            {t.distanceKm} km (~{t.estimatedTransitMinutes}m courier)
                          </span>
                        </div>

                        <p className="text-[11px] text-muted mt-0.5 italic line-clamp-1">{t.notes}</p>
                      </div>

                      <span className="text-[10px] font-mono text-muted flex-shrink-0 bg-white px-1.5 py-0.5 rounded border border-concrete">
                        {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Footnote */}
      <div className="text-[11px] text-muted text-center font-sans pb-2">
        * Estimated stockouts prevented are statistical model projections derived from baseline linear burn rates, not verified real-world clinical outcomes.
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { generateDemandForecast } from '../../services/shortageCalculator';
import { StatusBadge } from '../common/StatusBadge';
import {
  TrendingDown,
  Calendar,
  AlertTriangle,
  Info,
  Building2,
  Pill,
  ShieldCheck,
} from 'lucide-react';
import { Reveal } from '../motion/Reveal';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

export const ForecastingView: React.FC = () => {
  const { clinics, medicines, enrichedStock, activeEmergency } = useApp();

  // Select a medicine and clinic to drill down
  const [selectedMedId, setSelectedMedId] = useState<string>(medicines[0]?.id || 'm1');
  const [selectedClinicId, setSelectedClinicId] = useState<string>(clinics[1]?.id || 'c2');
  const [forecastDays, setForecastDays] = useState<number>(14);

  // Selected stock record
  const currentItem = useMemo(() => {
    return enrichedStock.find(
      (s) => s.medicineId === selectedMedId && s.clinicId === selectedClinicId
    );
  }, [enrichedStock, selectedMedId, selectedClinicId]);

  // Surge multiplier if active emergency targets this clinic & medicine
  const surgeMultiplier = useMemo(() => {
    if (
      activeEmergency &&
      activeEmergency.targetClinicId === selectedClinicId &&
      activeEmergency.affectedMedicineIds.includes(selectedMedId)
    ) {
      return activeEmergency.surgeMultiplier;
    }
    return 1.0;
  }, [activeEmergency, selectedClinicId, selectedMedId]);

  // Generated forecast curve
  const forecastData = useMemo(() => {
    if (!currentItem) return [];
    return generateDemandForecast(currentItem, forecastDays, surgeMultiplier);
  }, [currentItem, forecastDays, surgeMultiplier]);

  // Cross-clinic matrix for the selected medicine
  const crossClinicRunway = useMemo(() => {
    return clinics.map((clinic) => {
      const match = enrichedStock.find(
        (s) => s.medicineId === selectedMedId && s.clinicId === clinic.id
      );
      return {
        clinic,
        item: match,
        days: match ? match.calc.daysUntilStockout : 0,
        stock: match ? match.currentStock : 0,
        safety: match ? match.minSafetyStock : 0,
        status: match ? match.calc.status : 'OPTIMAL',
      };
    });
  }, [clinics, enrichedStock, selectedMedId]);

  const selectedMed = medicines.find((m) => m.id === selectedMedId);
  const selectedClinic = clinics.find((c) => c.id === selectedClinicId);

  return (
    <div className="space-y-6">
      {/* Editorial View Header */}
      <Reveal>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#2D3142]">
          <div>
            <div className="text-[11px] font-mono font-medium tracking-wider text-[#A0A0AA] uppercase mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6872C4] inline-block shadow-[0_0_8px_#6872C4]" />
              <span>Section 03 • Predictive Epidemiology</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal text-white tracking-tight font-serif">
              Shortage Forecasting &amp; Runway Analysis
            </h1>
            <p className="text-xs sm:text-sm text-[#A0A0AA] mt-0.5 max-w-2xl font-sans">
              Linear burn depletion curves and confidence intervals based on rolling consumption averages and emergency clinical load.
            </p>
          </div>

          {/* Forecast Horizon Selector */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#171923] p-1 rounded-lg border border-[#2D3142] shadow-md">
            <span className="text-xs font-medium text-[#A0A0AA] px-2 font-sans">Horizon:</span>
            {[7, 14, 21].map((days) => (
              <button
                key={days}
                onClick={() => setForecastDays(days)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3480] focus-visible:ring-offset-1 ${
                  forecastDays === days
                    ? 'bg-[#2C3480] text-white shadow-sm'
                    : 'text-[#A0A0AA] hover:text-white hover:bg-[#222431]'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Model Disclaimer Notice */}
      <Reveal delay={40}>
        <div className="bg-[#171923] border border-[#2D3142] rounded-lg p-4 flex items-start gap-3 shadow-md">
          <Info className="w-4 h-4 text-[#6872C4] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#A0A0AA] leading-relaxed font-sans">
            <strong className="font-semibold text-white">Statistical Model Notice:</strong> Projections represent deterministic linear consumption with ±12% clinical intake variance and day-of-week scaling. Actual future demand may vary with acute epidemiological outbreaks.
          </div>
        </div>
      </Reveal>

      {/* Selector Toolbar */}
      <Reveal delay={80}>
        <div className="bg-[#171923] rounded-lg p-5 shadow-lg border border-[#2D3142] grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#A0A0AA] mb-1.5 flex items-center gap-1.5 font-sans">
              <Pill className="w-3.5 h-3.5 text-[#6872C4]" />
              <span>Select Medicine to Forecast</span>
            </label>
            <select
              value={selectedMedId}
              onChange={(e) => setSelectedMedId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-[#2D3142] rounded-lg focus:border-[#2C3480] focus:ring-1 focus:ring-[#2C3480] outline-none bg-[#222431] font-semibold text-white cursor-pointer"
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.category} — {m.dosageForm})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A0A0AA] mb-1.5 flex items-center gap-1.5 font-sans">
              <Building2 className="w-3.5 h-3.5 text-[#6872C4]" />
              <span>Select Focus Clinic</span>
            </label>
            <select
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-[#2D3142] rounded-lg focus:border-[#2C3480] focus:ring-1 focus:ring-[#2C3480] outline-none bg-[#222431] font-semibold text-white cursor-pointer"
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Reveal>

      {/* Forecast Chart & Metric Card */}
      {currentItem ? (
        <Reveal delay={120}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-[#171923] rounded-lg p-6 shadow-lg border border-[#2D3142]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#2D3142]">
                <div>
                  <h2 className="text-base font-bold text-white font-sans">
                    {currentItem.medicine.name} — {currentItem.clinic.name}
                  </h2>
                  <p className="text-xs text-[#A0A0AA] font-sans">
                    Projected inventory depletion curve over next {forecastDays} days
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={currentItem.calc.status} size="sm" />
                  {surgeMultiplier > 1.0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#BB232B]/20 text-[#FF6B72] border border-[#BB232B]/50">
                      {surgeMultiplier}x Surge
                    </span>
                  )}
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2C3480" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2C3480" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A0A0AA" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#A0A0AA" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#A0A0AA' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#A0A0AA' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#080808',
                        border: '1px solid #2C3480',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontFamily: 'sans-serif',
                      }}
                      formatter={(val: any, name: any) => [
                        `${val} ${currentItem.medicine.unit}`,
                        name === 'projectedStock'
                          ? 'Projected Stock'
                          : name === 'confidenceUpper'
                          ? 'Upper Estimate'
                          : name === 'confidenceLower'
                          ? 'Lower Estimate'
                          : name,
                      ]}
                    />
                    <ReferenceLine
                      y={currentItem.minSafetyStock}
                      label={{
                        value: `Safety Reserve (${currentItem.minSafetyStock})`,
                        fill: '#FF6B72',
                        fontSize: 11,
                        position: 'top',
                      }}
                      stroke="#BB232B"
                      strokeDasharray="4 4"
                    />
                    <Area
                      type="monotone"
                      dataKey="confidenceUpper"
                      stroke="none"
                      fill="url(#confidenceGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="projectedStock"
                      stroke="#4A56C4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#stockGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-xs text-[#A0A0AA] pt-3 border-t border-[#2D3142] mt-2 font-sans">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#4A56C4] inline-block rounded-full"></span>
                    <span className="text-white">Projected Stock</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#BB232B] inline-block rounded-full"></span>
                    <span className="text-white">Safety Threshold</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-2 bg-[#2D3142] inline-block rounded-xs"></span>
                    <span className="text-[#A0A0AA]">Confidence Interval</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Model Explanation Card */}
            <div className="bg-[#171923] rounded-lg p-6 shadow-lg border border-[#2D3142] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#2D3142]">
                  <div className="w-7 h-7 rounded-lg bg-[#222431] flex items-center justify-center text-[#6872C4] border border-[#2D3142]">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white font-sans">Runway Calculations</h3>
                </div>

                <div className="space-y-3 text-xs text-[#A0A0AA]">
                  <div className="p-3 bg-[#222431] rounded-lg border border-[#2D3142]">
                    <span className="text-xs font-semibold text-white block mb-1 font-sans">
                      Burn Rate Formula
                    </span>
                    <div className="font-mono text-xs bg-[#080808] p-2 rounded border border-[#2D3142] text-white">
                      Days = {currentItem.currentStock} / {currentItem.avgDailyConsumption}
                    </div>
                    <p className="text-[#A0A0AA] text-xs mt-1.5 font-sans">
                      Current burn yields{' '}
                      <strong className="text-[#6872C4] font-bold font-mono">
                        {currentItem.calc.daysUntilStockout} days
                      </strong>{' '}
                      of remaining clinical coverage.
                    </p>
                  </div>

                  <div className="p-3 bg-[#222431] rounded-lg border border-[#2D3142]">
                    <span className="text-xs font-semibold text-white block mb-1 font-sans">
                      Safety Reserve Status
                    </span>
                    {currentItem.currentStock <= currentItem.minSafetyStock ? (
                      <div className="text-[#FF6B72] font-semibold flex items-center gap-1.5 font-sans text-xs">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Deficit active: {currentItem.calc.deficitQuantity} {currentItem.medicine.unit} below minimum</span>
                      </div>
                    ) : (
                      <p className="text-[#A0A0AA] text-xs font-sans">
                        Projected to cross safety threshold in{' '}
                        <strong className="text-white font-bold font-mono">
                          {Math.max(
                            0,
                            Math.round(
                              ((currentItem.currentStock - currentItem.minSafetyStock) /
                                currentItem.avgDailyConsumption) *
                                10
                            ) / 10
                          )}{' '}
                          days
                        </strong>.
                      </p>
                    )}
                  </div>

                  <div className="p-3 bg-[#222431] rounded-lg border border-[#2D3142]">
                    <span className="text-xs font-semibold text-white block mb-1 font-sans">
                      Batch Expiry vs. Runway
                    </span>
                    <p className="text-[#A0A0AA] text-xs leading-relaxed font-sans">
                      Batch <code className="font-mono text-white bg-[#080808] px-1 py-0.5 rounded border border-[#2D3142]">{currentItem.batchNumber}</code> expires{' '}
                      <strong className="text-white font-mono">{currentItem.expiryDate}</strong> ({currentItem.calc.daysToExpiry}d).
                      {currentItem.calc.daysToExpiry < currentItem.calc.daysUntilStockout ? (
                        <span className="text-[#FF6B72] font-semibold block mt-1">
                          Warning: Stock expires before full clinical consumption!
                        </span>
                      ) : (
                        <span className="text-[#5AA98C] font-medium block mt-1">
                          Optimal: Batch consumed before shelf-life expires.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#2D3142] mt-4 text-xs text-[#A0A0AA] font-sans">
                Last restocked: {currentItem.lastRestocked} • Capacity limit: {currentItem.maxCapacity} {currentItem.medicine.unit}
              </div>
            </div>
          </div>
        </Reveal>
      ) : (
        <div className="bg-[#171923] rounded-lg p-8 text-center text-[#A0A0AA] border border-[#2D3142]">
          No inventory record found for the selected clinic and medicine.
        </div>
      )}

      {/* Regional Cross-Clinic Comparison Table for Selected Medicine */}
      <Reveal delay={160}>
        <div className="bg-[#171923] rounded-lg p-6 shadow-lg border border-[#2D3142]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2D3142]">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#A0A0AA] mb-0.5">
                HORIZONTAL COMPARISON
              </div>
              <h3 className="text-base font-bold text-white font-sans">
                Regional Supply Balance: {selectedMed?.name}
              </h3>
              <p className="text-xs text-[#A0A0AA] font-sans">
                Side-by-side days of supply comparison across all 5 network clinics
              </p>
            </div>
            <span className="text-xs font-medium text-[#A4AADE] bg-[#222431] px-2.5 py-1 rounded-lg border border-[#2D3142]">
              {selectedMed?.category}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {crossClinicRunway.map((entry) => {
              const isTarget = entry.clinic.id === selectedClinicId;
              const days = entry.days;

              let cardTheme = 'bg-[#222431] border-[#2D3142] text-white';
              let textColor = 'text-white';
              if (days <= 2.5) {
                cardTheme = 'bg-[#BB232B]/15 border-[#BB232B]/40 text-[#FF6B72]';
                textColor = 'text-[#FF6B72]';
              } else if (days <= 7) {
                cardTheme = 'bg-[#B87A14]/15 border-[#B87A14]/40 text-[#F5CB7A]';
                textColor = 'text-[#F5CB7A] font-semibold';
              } else if (days > 25) {
                cardTheme = 'bg-[#16815D]/15 border-[#16815D]/40 text-[#5AA98C]';
                textColor = 'text-[#5AA98C] font-semibold';
              }

              return (
                <div
                  key={entry.clinic.id}
                  onClick={() => setSelectedClinicId(entry.clinic.id)}
                  className={`p-3.5 rounded-lg border transition-all duration-150 cursor-pointer ${cardTheme} ${
                    isTarget ? 'ring-2 ring-[#4A56C4] shadow-md' : 'hover:border-[#2C3480]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-[#A0A0AA] mb-1">
                    <span className="font-bold text-white font-mono">{entry.clinic.code}</span>
                    <span className="text-[11px]">{entry.clinic.type.split(' ')[0]}</span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate" title={entry.clinic.name}>
                    {entry.clinic.name}
                  </div>

                  <div className="mt-2.5">
                    <div className={`text-2xl font-bold font-serif tabular-nums ${textColor}`}>
                      {days}{' '}
                      <span className="text-xs font-normal text-[#A0A0AA] font-sans">days</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono text-[#A0A0AA] mt-1 tabular-nums">
                      <span>Stock: {entry.stock}</span>
                      <span>Min: {entry.safety}</span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#2D3142]">
                    <StatusBadge status={entry.status} size="sm" showIcon={false} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>
    </div>
  );
};

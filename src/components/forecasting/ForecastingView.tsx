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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#E5E3DC]">
          <div>
            <div className="text-[10px] font-sans font-semibold tracking-widest text-[#77766F] uppercase mb-1">
              PREDICTIVE EPIDEMIOLOGY / SECTION 03
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal text-[#171717] tracking-tight font-serif">
              Shortage Forecasting &amp; Runway Analysis
            </h1>
            <p className="text-xs sm:text-sm text-[#77766F] mt-0.5 max-w-2xl font-sans">
              Linear burn depletion curves and confidence intervals based on rolling consumption averages and emergency clinical load.
            </p>
          </div>

          {/* Forecast Horizon Selector */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white p-1 rounded border border-[#E5E3DC] shadow-xs">
            <span className="text-xs font-medium text-[#77766F] px-2 font-sans">Horizon:</span>
            {[7, 14, 21].map((days) => (
              <button
                key={days}
                onClick={() => setForecastDays(days)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] focus-visible:ring-offset-1 ${
                  forecastDays === days
                    ? 'bg-[#171717] text-white shadow-xs'
                    : 'text-[#77766F] hover:text-[#171717] hover:bg-[#F8F7F3]'
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
        <div className="bg-[#FFFFFF] border border-[#E5E3DC] rounded-xl p-4 flex items-start gap-3 shadow-print-sm">
          <Info className="w-4 h-4 text-[#77766F] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#77766F] leading-relaxed font-sans">
            <strong className="font-semibold text-[#171717]">Statistical Model Notice:</strong> Projections represent deterministic linear consumption with ±12% clinical intake variance and day-of-week scaling. Actual future demand may vary with acute epidemiological outbreaks.
          </div>
        </div>
      </Reveal>

      {/* Selector Toolbar */}
      <Reveal delay={80}>
        <div className="bg-[#FFFFFF] rounded-xl p-5 shadow-print-sm border border-[#E5E3DC] grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#77766F] mb-1.5 flex items-center gap-1.5 font-sans">
              <Pill className="w-3.5 h-3.5 text-[#171717]" />
              <span>Select Medicine to Forecast</span>
            </label>
            <select
              value={selectedMedId}
              onChange={(e) => setSelectedMedId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-[#E5E3DC] rounded focus:border-[#171717] focus:ring-1 focus:ring-[#171717] outline-none bg-[#F8F7F3] font-semibold text-[#171717] cursor-pointer"
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.category} — {m.dosageForm})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#77766F] mb-1.5 flex items-center gap-1.5 font-sans">
              <Building2 className="w-3.5 h-3.5 text-[#171717]" />
              <span>Select Focus Clinic</span>
            </label>
            <select
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-[#E5E3DC] rounded focus:border-[#171717] focus:ring-1 focus:ring-[#171717] outline-none bg-[#F8F7F3] font-semibold text-[#171717] cursor-pointer"
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
            <div className="lg:col-span-2 bg-[#FFFFFF] rounded-xl p-6 shadow-print-sm border border-[#E5E3DC]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E5E3DC]">
                <div>
                  <h2 className="text-base font-bold text-[#171717] font-sans">
                    {currentItem.medicine.name} — {currentItem.clinic.name}
                  </h2>
                  <p className="text-xs text-[#77766F] font-sans">
                    Projected inventory depletion curve over next {forecastDays} days
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={currentItem.calc.status} size="sm" />
                  {surgeMultiplier > 1.0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#FDF3F1] text-[#CB3520] border border-[#F6CCC5]">
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
                        <stop offset="5%" stopColor="#171717" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#171717" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#77766F" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#77766F" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#77766F' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#77766F' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#171717',
                        border: '1px solid #333330',
                        borderRadius: '6px',
                        color: '#F8F7F3',
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
                        fill: '#E44832',
                        fontSize: 11,
                        position: 'top',
                      }}
                      stroke="#E44832"
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
                      stroke="#171717"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#stockGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-xs text-[#77766F] pt-3 border-t border-[#E5E3DC] mt-2 font-sans">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#171717] inline-block rounded-full"></span>
                    <span>Projected Stock</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#E44832] inline-block rounded-full"></span>
                    <span>Safety Threshold</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-2 bg-[#E5E3DC] inline-block rounded-xs"></span>
                    <span>Confidence Interval</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Model Explanation Card */}
            <div className="bg-[#FFFFFF] rounded-xl p-6 shadow-print-sm border border-[#E5E3DC] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#E5E3DC]">
                  <div className="w-7 h-7 rounded bg-[#F8F7F3] flex items-center justify-center text-[#171717] border border-[#E5E3DC]">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#171717] font-sans">Runway Calculations</h3>
                </div>

                <div className="space-y-3 text-xs text-[#77766F]">
                  <div className="p-3 bg-[#F8F7F3] rounded border border-[#E5E3DC]">
                    <span className="text-xs font-semibold text-[#171717] block mb-1 font-sans">
                      Burn Rate Formula
                    </span>
                    <div className="font-mono text-xs bg-white p-2 rounded border border-[#E5E3DC] text-[#171717]">
                      Days = {currentItem.currentStock} / {currentItem.avgDailyConsumption}
                    </div>
                    <p className="text-[#77766F] text-xs mt-1.5 font-sans">
                      Current burn yields{' '}
                      <strong className="text-[#171717] font-bold font-mono">
                        {currentItem.calc.daysUntilStockout} days
                      </strong>{' '}
                      of remaining clinical coverage.
                    </p>
                  </div>

                  <div className="p-3 bg-[#F8F7F3] rounded border border-[#E5E3DC]">
                    <span className="text-xs font-semibold text-[#171717] block mb-1 font-sans">
                      Safety Reserve Status
                    </span>
                    {currentItem.currentStock <= currentItem.minSafetyStock ? (
                      <div className="text-[#E44832] font-semibold flex items-center gap-1.5 font-sans text-xs">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Deficit active: {currentItem.calc.deficitQuantity} {currentItem.medicine.unit} below minimum</span>
                      </div>
                    ) : (
                      <p className="text-[#77766F] text-xs font-sans">
                        Projected to cross safety threshold in{' '}
                        <strong className="text-[#171717] font-bold font-mono">
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

                  <div className="p-3 bg-[#F8F7F3] rounded border border-[#E5E3DC]">
                    <span className="text-xs font-semibold text-[#171717] block mb-1 font-sans">
                      Batch Expiry vs. Runway
                    </span>
                    <p className="text-[#77766F] text-xs leading-relaxed font-sans">
                      Batch <code className="font-mono text-[#171717] bg-white px-1 py-0.5 rounded border border-[#E5E3DC]">{currentItem.batchNumber}</code> expires{' '}
                      <strong className="text-[#171717] font-mono">{currentItem.expiryDate}</strong> ({currentItem.calc.daysToExpiry}d).
                      {currentItem.calc.daysToExpiry < currentItem.calc.daysUntilStockout ? (
                        <span className="text-[#E44832] font-semibold block mt-1">
                          Warning: Stock expires before full clinical consumption!
                        </span>
                      ) : (
                        <span className="text-[#1E6B52] font-medium block mt-1">
                          Optimal: Batch consumed before shelf-life expires.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E3DC] mt-4 text-xs text-[#77766F] font-sans">
                Last restocked: {currentItem.lastRestocked} • Capacity limit: {currentItem.maxCapacity} {currentItem.medicine.unit}
              </div>
            </div>
          </div>
        </Reveal>
      ) : (
        <div className="bg-[#FFFFFF] rounded-xl p-8 text-center text-[#77766F] border border-[#E5E3DC]">
          No inventory record found for the selected clinic and medicine.
        </div>
      )}

      {/* Regional Cross-Clinic Comparison Table for Selected Medicine */}
      <Reveal delay={160}>
        <div className="bg-[#FFFFFF] rounded-xl p-6 shadow-print-sm border border-[#E5E3DC]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5E3DC]">
            <div>
              <div className="text-[10px] font-sans font-semibold tracking-widest text-[#77766F] uppercase mb-0.5">
                HORIZONTAL COMPARISON
              </div>
              <h3 className="text-base font-bold text-[#171717] font-sans">
                Regional Supply Balance: {selectedMed?.name}
              </h3>
              <p className="text-xs text-[#77766F] font-sans">
                Side-by-side days of supply comparison across all 5 network clinics
              </p>
            </div>
            <span className="text-xs font-medium text-[#171717] bg-[#F8F7F3] px-2.5 py-1 rounded border border-[#E5E3DC]">
              {selectedMed?.category}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {crossClinicRunway.map((entry) => {
              const isTarget = entry.clinic.id === selectedClinicId;
              const days = entry.days;

              let cardTheme = 'bg-[#F8F7F3] border-[#E5E3DC] text-[#171717]';
              let textColor = 'text-[#171717]';
              if (days <= 2.5) {
                cardTheme = 'bg-[#FDF3F1] border-[#F6CCC5] text-[#CB3520]';
                textColor = 'text-[#CB3520]';
              } else if (days <= 7) {
                cardTheme = 'bg-[#FEF9EF] border-[#FAE0AD] text-[#9C6614]';
                textColor = 'text-[#9C6614] font-semibold';
              } else if (days > 25) {
                cardTheme = 'bg-[#F5F5F3] border-[#D1D1CC] text-[#171717]';
                textColor = 'text-[#171717] font-semibold';
              }

              return (
                <div
                  key={entry.clinic.id}
                  onClick={() => setSelectedClinicId(entry.clinic.id)}
                  className={`p-3.5 rounded border transition-all duration-150 cursor-pointer ${cardTheme} ${
                    isTarget ? 'ring-1 ring-[#171717] shadow-sm' : 'hover:border-[#171717]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-[#77766F] mb-1">
                    <span className="font-bold text-[#171717] font-mono">{entry.clinic.code}</span>
                    <span className="text-[11px]">{entry.clinic.type.split(' ')[0]}</span>
                  </div>
                  <div className="text-xs font-semibold text-[#171717] truncate" title={entry.clinic.name}>
                    {entry.clinic.name}
                  </div>

                  <div className="mt-2.5">
                    <div className={`text-2xl font-bold font-serif tabular-nums ${textColor}`}>
                      {days}{' '}
                      <span className="text-xs font-normal text-[#77766F] font-sans">days</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono text-[#77766F] mt-1 tabular-nums">
                      <span>Stock: {entry.stock}</span>
                      <span>Min: {entry.safety}</span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#E5E3DC]">
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

import React, { useMemo } from 'react';
import {
  X,
  Building2,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  TrendingDown,
  DollarSign,
  PackageCheck,
  ArrowRight,
  Clock,
  Thermometer,
  Edit2,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { EnrichedStockItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { generateDemandForecast } from '../../services/shortageCalculator';

interface MedicineInspectorDrawerProps {
  item: EnrichedStockItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: EnrichedStockItem) => void;
  onMatchDonor: (item: EnrichedStockItem) => void;
}

export const MedicineInspectorDrawer: React.FC<MedicineInspectorDrawerProps> = ({
  item,
  isOpen,
  onClose,
  onEdit,
  onMatchDonor,
}) => {
  const { clinics, stockRecords, enrichedStock } = useApp();

  // Multi-clinic distribution for this medicine across all 5 regional facilities
  const regionalPeers = useMemo(() => {
    if (!item) return [];
    return clinics.map((c) => {
      const match = enrichedStock.find(
        (s) => s.clinicId === c.id && s.medicineId === item.medicineId
      );
      return {
        clinic: c,
        stockItem: match || null,
      };
    });
  }, [item, clinics, enrichedStock]);

  // 14-day depletion forecast for the inspected clinic and medicine
  const forecastData = useMemo(() => {
    if (!item) return [];
    return generateDemandForecast(item, 14);
  }, [item]);

  if (!isOpen || !item) return null;

  const isCriticalOrLow =
    item.calc.status === 'CRITICAL' || item.calc.status === 'LOW_STOCK';

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-[#080808]/70 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white border-l border-[#E5E5E8] shadow-2xl flex flex-col justify-between overflow-y-auto">
          {/* Drawer Header */}
          <div className="p-6 border-b border-[#E5E5E8] bg-white space-y-3 sticky top-0 z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#737373] bg-[#F5F5F7] px-2 py-0.5 rounded-lg border border-[#E5E5E8]">
                    {item.medicine.category}
                  </span>
                  <StatusBadge status={item.calc.status} />
                </div>
                <h2 id="drawer-title" className="font-serif text-2xl text-[#080808] font-normal tracking-tight">
                  {item.medicine.name}
                </h2>
                <div className="text-xs text-[#737373] font-mono">
                  {item.medicine.genericName} &bull; {item.medicine.dosageForm}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#737373] hover:text-[#080808] hover:bg-[#F5F5F7] transition-colors"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Facility Context Tag */}
            <div className="flex items-center gap-1.5 text-xs text-[#080808] bg-[#F5F5F7] px-3 py-1.5 rounded-lg border border-[#E5E5E8] font-sans">
              <Building2 className="w-3.5 h-3.5 text-[#2C3480]" />
              <span className="font-semibold">{item.clinic.code}</span>
              <span className="text-[#737373]">— {item.clinic.name}</span>
            </div>
          </div>

          {/* Drawer Body Content */}
          <div className="p-6 space-y-6 flex-1 text-xs font-sans">
            {/* 1. Clinical Telemetry KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-[#F5F5F7] p-3 rounded-lg border border-[#E5E5E8]">
                <span className="text-[10px] text-[#737373] uppercase tracking-wider block">
                  Current Stock
                </span>
                <span className="text-xl font-mono font-bold text-[#080808]">
                  {item.currentStock}
                </span>
                <span className="text-[10px] text-[#737373] block">
                  Reserve: {item.minSafetyStock}
                </span>
              </div>

              <div className="bg-[#F5F5F7] p-3 rounded-lg border border-[#E5E5E8]">
                <span className="text-[10px] text-[#737373] uppercase tracking-wider block">
                  Daily Burn Rate
                </span>
                <span className="text-xl font-mono font-bold text-[#080808]">
                  {item.avgDailyConsumption}
                </span>
                <span className="text-[10px] text-[#737373] block">
                  units/day
                </span>
              </div>

              <div className="bg-[#F5F5F7] p-3 rounded-lg border border-[#E5E5E8]">
                <span className="text-[10px] text-[#737373] uppercase tracking-wider block">
                  Depletion Runway
                </span>
                <span
                  className={`text-xl font-mono font-bold ${
                    item.calc.daysUntilStockout <= 2.5
                      ? 'text-[#BB232B]'
                      : item.calc.daysUntilStockout <= 7
                      ? 'text-[#B87A14]'
                      : 'text-[#16815D]'
                  }`}
                >
                  {item.calc.daysUntilStockout}d
                </span>
                <span className="text-[10px] text-[#737373] block">
                  until stockout
                </span>
              </div>

              <div className="bg-[#F5F5F7] p-3 rounded-lg border border-[#E5E5E8]">
                <span className="text-[10px] text-[#737373] uppercase tracking-wider block">
                  Expiry Horizon
                </span>
                <span
                  className={`text-xl font-mono font-bold ${
                    item.calc.daysToExpiry <= 30 ? 'text-[#BB232B]' : 'text-[#080808]'
                  }`}
                >
                  {item.calc.daysToExpiry}d
                </span>
                <span className="text-[10px] text-[#737373] block truncate">
                  #{item.batchNumber}
                </span>
              </div>
            </div>

            {/* 2. Clinical Monograph & Handling Specs */}
            <div className="bg-white p-4 rounded-lg border border-[#E5E5E8] space-y-2.5">
              <span className="font-semibold text-xs text-[#080808] uppercase tracking-wider block font-sans">
                Pharmaceutical Properties & Storage
              </span>

              <p className="text-[#737373] leading-relaxed">
                {item.medicine.description}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5E5E8]/60 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-[#737373]">
                  <Thermometer className="w-3.5 h-3.5 text-[#2C3480]" />
                  <span>{item.medicine.storageCondition}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#737373]">
                  <DollarSign className="w-3.5 h-3.5 text-[#16815D]" />
                  <span>${item.medicine.standardUnitCost.toFixed(2)} per unit</span>
                </div>
              </div>
            </div>

            {/* 3. 14-Day Depletion Projection Chart */}
            <div className="bg-white p-4 rounded-lg border border-[#E5E5E8] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#080808] uppercase tracking-wider font-sans">
                  14-Day Stock Depletion Trajectory
                </span>
                <span className="text-[10px] font-mono text-[#737373]">
                  Clinical Burn Model
                </span>
              </div>

              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="drawerStockGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isCriticalOrLow ? '#BB232B' : '#2C3480'} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={isCriticalOrLow ? '#BB232B' : '#2C3480'} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="dayName" tick={{ fontSize: 9, fill: '#737373' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#737373' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#080808] text-white p-2 rounded-lg text-[11px] font-mono shadow-md border border-[#2C3480]/40">
                              <div>{data.dayName} ({data.date})</div>
                              <div className="text-[#16815D]">Projected: {data.projectedStock} units</div>
                              <div className="text-[#E5E5E8]">Consumption: {data.dailyBurn} units</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="projectedStock"
                      stroke={isCriticalOrLow ? '#BB232B' : '#2C3480'}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#drawerStockGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Multi-Clinic Regional Stock Distribution */}
            <div className="bg-white p-4 rounded-lg border border-[#E5E5E8] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#080808] uppercase tracking-wider font-sans">
                  Regional Network Distribution (5 Clinics)
                </span>
                <span className="text-[10px] font-mono text-[#737373]">
                  Mutual-Aid Corridors
                </span>
              </div>

              <div className="divide-y divide-[#E5E5E8]/60 text-xs">
                {regionalPeers.map(({ clinic, stockItem }) => {
                  const isCurrent = clinic.id === item.clinicId;
                  const stock = stockItem?.currentStock || 0;
                  const safety = stockItem?.minSafetyStock || 0;
                  const surplus = Math.max(0, stock - safety);
                  const deficit = Math.max(0, safety - stock);

                  return (
                    <div
                      key={clinic.id}
                      className={`py-2 px-2 rounded-lg flex items-center justify-between gap-3 ${
                        isCurrent ? 'bg-[#F5F5F7] font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[#080808] text-[11px] w-8">
                          {clinic.code}
                        </span>
                        <span className="text-[#737373] truncate text-[11px]">
                          {clinic.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-mono bg-[#2C3480] text-white px-1.5 py-0.5 rounded">
                            CURRENT
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-right font-mono text-[11px] flex-shrink-0">
                        <span>{stock} units</span>
                        {surplus > 0 ? (
                          <span className="text-[#16815D] font-semibold">+{surplus} surplus</span>
                        ) : deficit > 0 ? (
                          <span className="text-[#BB232B] font-semibold">-{deficit} deficit</span>
                        ) : (
                          <span className="text-[#737373]">balanced</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 border-t border-[#E5E5E8] bg-[#F5F5F7] flex items-center justify-between gap-3 sticky bottom-0">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-sans text-[#080808] bg-white hover:bg-[#F5F5F7] border border-[#E5E5E8] transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#737373]" />
              <span>Edit Record</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onMatchDonor(item);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-sans font-medium text-white bg-[#2C3480] hover:bg-[#232a6b] transition-colors cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Match Regional Donors</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

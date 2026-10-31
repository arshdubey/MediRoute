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
        className="fixed inset-0 bg-[#142536]/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-[#FFFFFF] border-l border-[#E2DDD5] shadow-2xl flex flex-col justify-between overflow-y-auto">
          {/* Drawer Header */}
          <div className="p-6 border-b border-[#E2DDD5] bg-[#FFFFFF] space-y-3 sticky top-0 z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#718294] bg-[#F7F5F0] px-2 py-0.5 rounded border border-[#E2DDD5]">
                    {item.medicine.category}
                  </span>
                  <StatusBadge status={item.calc.status} />
                </div>
                <h2 id="drawer-title" className="font-serif text-2xl text-[#142536] font-normal tracking-tight">
                  {item.medicine.name}
                </h2>
                <div className="text-xs text-[#5A6E85] font-mono">
                  {item.medicine.genericName} &bull; {item.medicine.dosageForm}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded text-[#5A6E85] hover:text-[#142536] hover:bg-[#F7F5F0] transition-colors"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Facility Context Tag */}
            <div className="flex items-center gap-1.5 text-xs text-[#142536] bg-[#F7F5F0] px-3 py-1.5 rounded border border-[#E2DDD5] font-sans">
              <Building2 className="w-3.5 h-3.5 text-[#5A6E85]" />
              <span className="font-semibold">{item.clinic.code}</span>
              <span className="text-[#718294]">— {item.clinic.name}</span>
            </div>
          </div>

          {/* Drawer Body Content */}
          <div className="p-6 space-y-6 flex-1 text-xs font-sans">
            {/* 1. Clinical Telemetry KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-[#FAF8F5] p-3 rounded border border-[#EBE7DF]">
                <span className="text-[10px] text-[#718294] uppercase tracking-wider block">
                  Current Stock
                </span>
                <span className="text-xl font-mono font-bold text-[#142536]">
                  {item.currentStock}
                </span>
                <span className="text-[10px] text-[#718294] block">
                  Reserve: {item.minSafetyStock}
                </span>
              </div>

              <div className="bg-[#FAF8F5] p-3 rounded border border-[#EBE7DF]">
                <span className="text-[10px] text-[#718294] uppercase tracking-wider block">
                  Daily Burn Rate
                </span>
                <span className="text-xl font-mono font-bold text-[#142536]">
                  {item.avgDailyConsumption}
                </span>
                <span className="text-[10px] text-[#718294] block">
                  units/day
                </span>
              </div>

              <div className="bg-[#FAF8F5] p-3 rounded border border-[#EBE7DF]">
                <span className="text-[10px] text-[#718294] uppercase tracking-wider block">
                  Depletion Runway
                </span>
                <span
                  className={`text-xl font-mono font-bold ${
                    item.calc.daysUntilStockout <= 2.5
                      ? 'text-[#E74732]'
                      : item.calc.daysUntilStockout <= 7
                      ? 'text-[#D97706]'
                      : 'text-[#1D7055]'
                  }`}
                >
                  {item.calc.daysUntilStockout}d
                </span>
                <span className="text-[10px] text-[#718294] block">
                  until stockout
                </span>
              </div>

              <div className="bg-[#FAF8F5] p-3 rounded border border-[#EBE7DF]">
                <span className="text-[10px] text-[#718294] uppercase tracking-wider block">
                  Expiry Horizon
                </span>
                <span
                  className={`text-xl font-mono font-bold ${
                    item.calc.daysToExpiry <= 30 ? 'text-[#E74732]' : 'text-[#142536]'
                  }`}
                >
                  {item.calc.daysToExpiry}d
                </span>
                <span className="text-[10px] text-[#718294] block truncate">
                  #{item.batchNumber}
                </span>
              </div>
            </div>

            {/* 2. Clinical Monograph & Handling Specs */}
            <div className="bg-[#FFFFFF] p-4 rounded border border-[#E2DDD5] space-y-2.5">
              <span className="font-semibold text-xs text-[#142536] uppercase tracking-wider block font-sans">
                Pharmaceutical Properties & Storage
              </span>

              <p className="text-[#5A6E85] leading-relaxed">
                {item.medicine.description}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F2EFE9] text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-[#5A6E85]">
                  <Thermometer className="w-3.5 h-3.5 text-[#5A6E85]" />
                  <span>{item.medicine.storageCondition}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#5A6E85]">
                  <DollarSign className="w-3.5 h-3.5 text-[#5A6E85]" />
                  <span>${item.medicine.standardUnitCost.toFixed(2)} per unit</span>
                </div>
              </div>
            </div>

            {/* 3. 14-Day Depletion Projection Chart */}
            <div className="bg-[#FFFFFF] p-4 rounded border border-[#E2DDD5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#142536] uppercase tracking-wider font-sans">
                  14-Day Stock Depletion Trajectory
                </span>
                <span className="text-[10px] font-mono text-[#718294]">
                  Clinical Burn Model
                </span>
              </div>

              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="drawerStockGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isCriticalOrLow ? '#E74732' : '#1D7055'} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={isCriticalOrLow ? '#E74732' : '#1D7055'} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="dayName" tick={{ fontSize: 9, fill: '#718294' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#718294' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#142536] text-white p-2 rounded text-[11px] font-mono shadow-md">
                              <div>{data.dayName} ({data.date})</div>
                              <div className="text-[#4ADE80]">Projected: {data.projectedStock} units</div>
                              <div className="text-[#CBD5E1]">Consumption: {data.dailyBurn} units</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="projectedStock"
                      stroke={isCriticalOrLow ? '#E74732' : '#1D7055'}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#drawerStockGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Multi-Clinic Regional Stock Distribution */}
            <div className="bg-[#FFFFFF] p-4 rounded border border-[#E2DDD5] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#142536] uppercase tracking-wider font-sans">
                  Regional Network Distribution (5 Clinics)
                </span>
                <span className="text-[10px] font-mono text-[#718294]">
                  Mutual-Aid Corridors
                </span>
              </div>

              <div className="divide-y divide-[#F2EFE9] text-xs">
                {regionalPeers.map(({ clinic, stockItem }) => {
                  const isCurrent = clinic.id === item.clinicId;
                  const stock = stockItem?.currentStock || 0;
                  const safety = stockItem?.minSafetyStock || 0;
                  const surplus = Math.max(0, stock - safety);
                  const deficit = Math.max(0, safety - stock);

                  return (
                    <div
                      key={clinic.id}
                      className={`py-2 px-2 rounded flex items-center justify-between gap-3 ${
                        isCurrent ? 'bg-[#FAF8F5] font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[#142536] text-[11px] w-8">
                          {clinic.code}
                        </span>
                        <span className="text-[#5A6E85] truncate text-[11px]">
                          {clinic.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-mono bg-[#142536] text-white px-1 rounded">
                            CURRENT
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-right font-mono text-[11px] flex-shrink-0">
                        <span>{stock} units</span>
                        {surplus > 0 ? (
                          <span className="text-[#1D7055] font-semibold">+{surplus} surplus</span>
                        ) : deficit > 0 ? (
                          <span className="text-[#E74732] font-semibold">-{deficit} deficit</span>
                        ) : (
                          <span className="text-[#718294]">balanced</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 border-t border-[#E2DDD5] bg-[#FAF8F5] flex items-center justify-between gap-3 sticky bottom-0">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-xs font-sans text-[#142536] bg-[#FFFFFF] hover:bg-[#F2EFE9] border border-[#D5CFBF] transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#5A6E85]" />
              <span>Edit Record</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onMatchDonor(item);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-sans font-medium text-white bg-[#142536] hover:bg-[#1E344A] transition-colors cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-[#1D7055]" />
              <span>Match Regional Donors</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

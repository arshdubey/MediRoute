import React, { useState, useMemo } from 'react';
import { Clock, Filter, AlertTriangle, ArrowRight, Building2, PackageCheck } from 'lucide-react';
import { StockRecord, Clinic, Medicine } from '../../types';
import {
  analyzeBatchExpiry,
  classifyExpiryRiskTier,
  ExpiryBatchAnalysis,
  ExpiryRiskTier,
} from '../../services/fefoEngine';

interface ExpiryTimelineProps {
  stockRecords: StockRecord[];
  clinics: Clinic[];
  medicines: Medicine[];
  onSelectBatch?: (analysis: ExpiryBatchAnalysis) => void;
  selectedBatchNumber?: string | null;
  activeFilter?: TimelineFilter;
  onFilterChange?: (filter: TimelineFilter) => void;
}

type TimelineFilter = '7D' | '30D' | '60D' | '90D' | 'ALL' | 'EXPIRED';

export const ExpiryTimeline: React.FC<ExpiryTimelineProps> = ({
  stockRecords,
  clinics,
  medicines,
  onSelectBatch,
  selectedBatchNumber,
  activeFilter,
  onFilterChange,
}) => {
  const [internalFilter, setInternalFilter] = useState<TimelineFilter>('ALL');
  const filter = activeFilter !== undefined ? activeFilter : internalFilter;
  const setFilter = (next: TimelineFilter) => {
    setInternalFilter(next);
    if (onFilterChange) onFilterChange(next);
  };
  const [clinicFilter, setClinicFilter] = useState<string>('ALL');

  const clinicMap = useMemo(() => new Map(clinics.map((c) => [c.id, c])), [clinics]);
  const medMap = useMemo(() => new Map(medicines.map((m) => [m.id, m])), [medicines]);

  // Analyze all batches from state
  const analyzedBatches = useMemo(() => {
    return stockRecords
      .map((sr) => {
        const clinic = clinicMap.get(sr.clinicId);
        const med = medMap.get(sr.medicineId);
        if (!clinic || !med) return null;
        return analyzeBatchExpiry(sr, clinic, med, new Date());
      })
      .filter((b): b is ExpiryBatchAnalysis => b !== null)
      .sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  }, [stockRecords, clinicMap, medMap]);

  // Apply filters
  const filteredBatches = useMemo(() => {
    return analyzedBatches.filter((b) => {
      // Clinic filter
      if (clinicFilter !== 'ALL' && b.clinicId !== clinicFilter) {
        return false;
      }

      // Time horizon filter
      if (filter === '7D') {
        return b.daysToExpiry > 0 && b.daysToExpiry <= 7;
      }
      if (filter === '30D') {
        return b.daysToExpiry > 0 && b.daysToExpiry <= 30;
      }
      if (filter === '60D') {
        return b.daysToExpiry > 0 && b.daysToExpiry <= 60;
      }
      if (filter === '90D') {
        return b.daysToExpiry > 0 && b.daysToExpiry <= 90;
      }
      if (filter === 'EXPIRED') {
        return b.daysToExpiry <= 0;
      }
      return true;
    });
  }, [analyzedBatches, filter, clinicFilter]);

  const getTierBadge = (tier: ExpiryRiskTier, days: number) => {
    switch (tier) {
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#2D1614] text-[#F87171] border border-[#7F1D1D]">
            EXPIRED ({Math.abs(days)}d ago)
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FDF3F1] text-[#E74732] border border-[#E74732]">
            CRITICAL ({days}d left)
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FFF9F2] text-[#D97706] border border-[#F59E0B]">
            HIGH ({days}d left)
          </span>
        );
      case 'MODERATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#93C5FD]">
            MODERATE ({days}d left)
          </span>
        );
      case 'WATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F8FAFC] text-[#64748B] border border-[#CBD5E1]">
            WATCH ({days}d left)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F0FDF4] text-[#1D7055] border border-[#BBF7D0]">
            NORMAL ({days}d)
          </span>
        );
    }
  };

  return (
    <div className="bg-[#FFFFFF] rounded border border-[#E2DDD5] p-5 shadow-xs space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E2DDD5]">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#142536]" />
            <h3 className="font-serif text-lg text-[#142536] font-normal tracking-tight">
              Chronological Expiry Timeline
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F7F5F0] text-[#5A6E85] border border-[#E2DDD5]">
              {filteredBatches.length} {filteredBatches.length === 1 ? 'batch' : 'batches'}
            </span>
          </div>
          <p className="text-xs text-[#718294] mt-0.5 font-sans">
            Sorted by earliest expiration. Select any batch to inspect consumption feasibility.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Horizon Filters */}
          <div className="flex items-center bg-[#F7F5F0] rounded p-0.5 border border-[#E2DDD5] text-xs">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded transition-colors font-sans text-xs ${
                filter === 'ALL'
                  ? 'bg-[#142536] text-white font-medium shadow-xs'
                  : 'text-[#5A6E85] hover:text-[#142536]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('7D')}
              className={`px-2.5 py-1 rounded transition-colors font-sans text-xs ${
                filter === '7D'
                  ? 'bg-[#E74732] text-white font-medium shadow-xs'
                  : 'text-[#5A6E85] hover:text-[#E74732]'
              }`}
            >
              &le; 7 Days
            </button>
            <button
              type="button"
              onClick={() => setFilter('30D')}
              className={`px-2.5 py-1 rounded transition-colors font-sans text-xs ${
                filter === '30D'
                  ? 'bg-[#D97706] text-white font-medium shadow-xs'
                  : 'text-[#5A6E85] hover:text-[#D97706]'
              }`}
            >
              &le; 30 Days
            </button>
            <button
              type="button"
              onClick={() => setFilter('60D')}
              className={`px-2.5 py-1 rounded transition-colors font-sans text-xs ${
                filter === '60D'
                  ? 'bg-[#142536] text-white font-medium shadow-xs'
                  : 'text-[#5A6E85] hover:text-[#142536]'
              }`}
            >
              &le; 60 Days
            </button>
            <button
              type="button"
              onClick={() => setFilter('90D')}
              className={`px-2.5 py-1 rounded transition-colors font-sans text-xs ${
                filter === '90D'
                  ? 'bg-[#142536] text-white font-medium shadow-xs'
                  : 'text-[#5A6E85] hover:text-[#142536]'
              }`}
            >
              &le; 90 Days
            </button>
            <button
              type="button"
              onClick={() => setFilter('EXPIRED')}
              className={`px-2.5 py-1 rounded transition-colors font-sans text-xs ${
                filter === 'EXPIRED'
                  ? 'bg-[#7F1D1D] text-white font-medium shadow-xs'
                  : 'text-[#5A6E85] hover:text-[#7F1D1D]'
              }`}
            >
              Expired
            </button>
          </div>

          {/* Facility Filter */}
          <select
            value={clinicFilter}
            aria-label="Filter by Facility"
            onChange={(e) => setClinicFilter(e.target.value)}
            className="text-xs bg-[#F7F5F0] border border-[#E2DDD5] rounded px-2.5 py-1 text-[#142536] font-sans focus:outline-none focus:ring-1 focus:ring-[#142536]"
          >
            <option value="ALL">All Facilities</option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual Timeline Lane */}
      <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
        {filteredBatches.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#718294] font-sans">
            No batches match the selected expiry horizon and facility filters.
          </div>
        ) : (
          filteredBatches.map((batch) => {
            const isSelected = selectedBatchNumber === batch.batchNumber;

            return (
              <div
                key={batch.stockRecordId}
                onClick={() => onSelectBatch && onSelectBatch(batch)}
                className={`p-3.5 rounded border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#F2EFE9] border-[#142536] ring-1 ring-[#142536]'
                    : 'bg-[#FDFDFD] border-[#EAE6DF] hover:border-[#142536] hover:bg-[#FAF8F5]'
                }`}
              >
                {/* Left Column: Medicine & Identification */}
                <div className="space-y-1 min-w-0 md:w-1/3">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-semibold text-xs text-[#142536] truncate">
                      {batch.medicineName}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EBE7DF] text-[#475569]">
                      {batch.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#718294] font-mono text-[11px]">
                    <span className="text-[#142536] font-semibold">#{batch.batchNumber}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-sans text-xs">
                      <Building2 className="w-3 h-3 text-[#5A6E85]" />
                      {batch.clinicCode} ({batch.clinicName})
                    </span>
                  </div>
                </div>

                {/* Middle Column: Stock, Safety Reserve & Local Feasibility */}
                <div className="grid grid-cols-3 gap-2 text-xs md:w-5/12 bg-[#F7F5F0] p-2 rounded border border-[#EBE7DF]">
                  <div>
                    <span className="text-[10px] text-[#718294] uppercase tracking-wider block font-sans">
                      Current Stock
                    </span>
                    <span className="font-mono font-bold text-xs text-[#142536]">
                      {batch.currentStock} units
                    </span>
                    <span className="text-[10px] text-[#718294] block font-sans">
                      Min reserve: {batch.minSafetyStock}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#718294] uppercase tracking-wider block font-sans">
                      Local Burn
                    </span>
                    <span className="font-mono text-xs text-[#142536]">
                      {batch.avgDailyConsumption}/day
                    </span>
                    <span className="text-[10px] text-[#718294] block font-sans">
                      Uses ~{batch.localProjectedConsumption}d
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#718294] uppercase tracking-wider block font-sans">
                      At-Risk Surplus
                    </span>
                    <span
                      className={`font-mono font-bold text-xs ${
                        batch.projectedUnusedStock > 0 ? 'text-[#E74732]' : 'text-[#1D7055]'
                      }`}
                    >
                      {batch.projectedUnusedStock > 0 ? `${batch.projectedUnusedStock} units` : '0 units'}
                    </span>
                    <span className="text-[10px] text-[#718294] block font-sans">
                      {batch.projectedUnusedStock > 0 ? `~$${batch.potentialWastageExposure.toFixed(0)} loss` : 'Fully utilized'}
                    </span>
                  </div>
                </div>

                {/* Right Column: Expiry Date, Tier Badge & Action */}
                <div className="flex items-center justify-between md:justify-end gap-3 md:w-1/4">
                  <div className="text-right">
                    <div className="text-xs font-mono font-medium text-[#142536]">
                      {batch.expiryDate}
                    </div>
                    <div className="mt-0.5">{getTierBadge(batch.riskTier, batch.daysToExpiry)}</div>
                  </div>

                  <button
                    type="button"
                    className="p-1.5 rounded text-[#5A6E85] hover:text-[#142536] hover:bg-[#EAE6DF] transition-colors"
                    title="Inspect Batch"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { ShieldCheck, AlertTriangle, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { ExpiryOverviewMetrics } from '../../services/fefoEngine';

interface ExpiryOverviewCardsProps {
  metrics: ExpiryOverviewMetrics;
  onFilterSelect?: (filter: 'ALL' | '7D' | '30D' | '60D' | '90D' | 'EXPIRED') => void;
  activeFilter?: string;
}

export const ExpiryOverviewCards: React.FC<ExpiryOverviewCardsProps> = ({
  metrics,
  onFilterSelect,
  activeFilter = 'ALL',
}) => {
  return (
    <div className="space-y-4">
      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Monitored Batches */}
        <div className="bg-[#FFFFFF] p-4 rounded border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#5A6E85] font-sans font-medium uppercase tracking-wider mb-1.5">
            <span>Total Batches</span>
            <Clock className="w-3.5 h-3.5 text-[#5A6E85]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#142536] font-normal tracking-tight">
            {metrics.totalBatches}
          </div>
          <div className="text-[11px] text-[#718294] mt-1 font-sans">
            5 regional clinics monitored
          </div>
        </div>

        {/* Critical: 1 to 7 Days */}
        <button
          type="button"
          onClick={() => onFilterSelect && onFilterSelect('7D')}
          className={`text-left p-4 rounded border transition-all cursor-pointer ${
            activeFilter === '7D'
              ? 'bg-[#FDF3F1] border-[#E74732] ring-1 ring-[#E74732]'
              : 'bg-[#FFFFFF] border-[#E2DDD5] hover:border-[#E74732]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#E74732] font-sans font-medium uppercase tracking-wider mb-1.5">
            <span>Critical (&le; 7 Days)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#E74732]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#E74732] font-normal tracking-tight">
            {metrics.expiringWithin7Days}
          </div>
          <div className="text-[11px] text-[#8C3A2F] mt-1 font-sans">
            Immediate dispatch required
          </div>
        </button>

        {/* High Risk: 8 to 30 Days */}
        <button
          type="button"
          onClick={() => onFilterSelect && onFilterSelect('30D')}
          className={`text-left p-4 rounded border transition-all cursor-pointer ${
            activeFilter === '30D'
              ? 'bg-[#FFF9F2] border-[#D97706] ring-1 ring-[#D97706]'
              : 'bg-[#FFFFFF] border-[#E2DDD5] hover:border-[#D97706]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#B45309] font-sans font-medium uppercase tracking-wider mb-1.5">
            <span>High Risk (8-30 Days)</span>
            <Clock className="w-3.5 h-3.5 text-[#B45309]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#142536] font-normal tracking-tight">
            {metrics.expiringWithin30Days}
          </div>
          <div className="text-[11px] text-[#718294] mt-1 font-sans">
            Includes 24-day Insulin surplus
          </div>
        </button>

        {/* High-Risk Inventory Quantity */}
        <div className="bg-[#FFFFFF] p-4 rounded border border-[#E2DDD5] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#5A6E85] font-sans font-medium uppercase tracking-wider mb-1.5">
            <span>High-Risk Units</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#5A6E85]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#142536] font-normal tracking-tight">
            {metrics.highRiskInventoryQuantity.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#718294] mt-1 font-sans">
            Physical stock &le; 30d expiry
          </div>
        </div>

        {/* Estimated Wastage Exposure */}
        <div className="bg-[#FFFFFF] p-4 rounded border border-[#E2DDD5] shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-xs text-[#5A6E85] font-sans font-medium uppercase tracking-wider mb-1.5">
            <span>Wastage Exposure</span>
            <DollarSign className="w-3.5 h-3.5 text-[#E74732]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#142536] font-normal tracking-tight">
            ${metrics.estimatedWastageExposure.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-[#718294] mt-1 font-sans">
            Potential loss without FEFO
          </div>
        </div>
      </div>

      {/* Secondary Risk Classification Breakdown Banner */}
      <div className="bg-[#142536] text-[#F7F5F0] rounded p-4 border border-[#1E344A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#A6B4C2] bg-[#1E344A] px-1.5 py-0.5 rounded">
              Risk Stratification Standard
            </span>
            <span className="text-xs text-[#1D7055] font-medium bg-[#0E3A2B] px-2 py-0.5 rounded border border-[#1D7055]">
              FEFO Invariant Compliant
            </span>
          </div>
          <p className="text-xs text-[#C5D0DC] font-sans">
            Batches are classified by remaining calendar days. Expired stock is strictly quarantined and blocked from redistribution.
          </p>
        </div>

        {/* Tier Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2D1614] text-[#F87171] border border-[#7F1D1D] font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            Critical (&le; 7d): {metrics.expiringWithin7Days}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2E200C] text-[#FBBF24] border border-[#78350F] font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            High (8-30d): {metrics.expiringWithin30Days}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#162738] text-[#93C5FD] border border-[#1E3A5F] font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
            Moderate (31-60d): {metrics.expiringWithin60Days}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#162738] text-[#CBD5E1] border border-[#334155] font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
            Watch (61-90d): {metrics.expiringWithin90Days}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#251315] text-[#FCA5A5] border border-[#991B1B] font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            Expired (&le; 0d): {metrics.expiredBatches}
          </span>
        </div>
      </div>
    </div>
  );
};

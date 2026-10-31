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
        <div className="bg-[#171923] p-4 rounded-lg border border-[#2D3142] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#A0A0AA] font-sans font-medium uppercase tracking-wider mb-1.5">
            <span>Total Batches</span>
            <Clock className="w-3.5 h-3.5 text-[#A0A0AA]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-white font-normal tracking-tight">
            {metrics.totalBatches}
          </div>
          <div className="text-[11px] text-[#A0A0AA] mt-1 font-sans">
            5 regional clinics monitored
          </div>
        </div>

        {/* Critical: 1 to 7 Days */}
        <button
          type="button"
          onClick={() => onFilterSelect && onFilterSelect('7D')}
          className={`text-left p-4 rounded-lg border transition-all cursor-pointer ${
            activeFilter === '7D'
              ? 'bg-[#BB232B]/20 border-[#BB232B] ring-1 ring-[#BB232B]'
              : 'bg-[#171923] border-[#2D3142] hover:border-[#BB232B]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#FF6B72] font-sans font-medium uppercase tracking-wider mb-1.5">
            <span>Critical (&le; 7 Days)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#FF6B72]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#FF6B72] font-normal tracking-tight">
            {metrics.expiringWithin7Days}
          </div>
          <div className="text-[11px] text-[#FF6B72] mt-1 font-sans font-medium">
            Immediate dispatch required
          </div>
        </button>

        {/* High Risk: 8 to 30 Days */}
        <button
          type="button"
          onClick={() => onFilterSelect && onFilterSelect('30D')}
          className={`text-left p-4 rounded-lg border transition-all cursor-pointer ${
            activeFilter === '30D'
              ? 'bg-[#D98A1A]/20 border-[#D98A1A] ring-1 ring-[#D98A1A]'
              : 'bg-[#171923] border-[#2D3142] hover:border-[#D98A1A]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#F5A623] font-sans font-medium uppercase tracking-wider mb-1.5">
            <span>High Risk (8-30 Days)</span>
            <Clock className="w-3.5 h-3.5 text-[#F5A623]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-white font-normal tracking-tight">
            {metrics.expiringWithin30Days}
          </div>
          <div className="text-[11px] text-[#A0A0AA] mt-1 font-sans">
            Includes 24-day Insulin surplus
          </div>
        </button>

        {/* High-Risk Inventory Quantity */}
        <div className="bg-[#171923] p-4 rounded-lg border border-[#2D3142] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#A0A0AA] font-sans font-medium uppercase tracking-wider mb-1.5">
            <span>High-Risk Units</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#A0A0AA]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-white font-normal tracking-tight">
            {metrics.highRiskInventoryQuantity.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#A0A0AA] mt-1 font-sans">
            Physical stock &le; 30d expiry
          </div>
        </div>

        {/* Estimated Wastage Exposure */}
        <div className="bg-[#171923] p-4 rounded-lg border border-[#2D3142] shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-xs text-[#A0A0AA] font-sans font-medium uppercase tracking-wider mb-1.5">
            <span>Wastage Exposure</span>
            <DollarSign className="w-3.5 h-3.5 text-[#FF6B72]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-white font-normal tracking-tight">
            ${metrics.estimatedWastageExposure.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-[#A0A0AA] mt-1 font-sans">
            Potential loss without FEFO
          </div>
        </div>
      </div>

      {/* Secondary Risk Classification Breakdown Banner */}
      <div className="bg-[#080808] text-white rounded-lg p-4 border border-[#2D3142] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#A0A0AA] bg-[#222431] px-1.5 py-0.5 rounded border border-[#2D3142]">
              Risk Stratification Standard
            </span>
            <span className="text-xs text-[#5AA98C] font-medium bg-[#16815D]/20 px-2 py-0.5 rounded border border-[#16815D]/40">
              FEFO Invariant Compliant
            </span>
          </div>
          <p className="text-xs text-[#A0A0AA] font-sans">
            Batches are classified by remaining calendar days. Expired stock is strictly quarantined and blocked from redistribution.
          </p>
        </div>

        {/* Tier Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#BB232B]/20 text-[#FF6B72] border border-[#BB232B]/40 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B72]" />
            Critical (&le; 7d): {metrics.expiringWithin7Days}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#D98A1A]/20 text-[#F5A623] border border-[#D98A1A]/40 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" />
            High (8-30d): {metrics.expiringWithin30Days}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2C3480]/30 text-white border border-[#2C3480] font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Moderate (31-60d): {metrics.expiringWithin60Days}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#222431] text-[#A0A0AA] border border-[#2D3142] font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A0A0AA]" />
            Watch (61-90d): {metrics.expiringWithin90Days}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#BB232B]/20 text-[#FF6B72] border border-[#BB232B]/30 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B72]" />
            Expired (&le; 0d): {metrics.expiredBatches}
          </span>
        </div>
      </div>
    </div>
  );
};

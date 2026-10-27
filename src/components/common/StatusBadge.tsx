import React from 'react';
import { StockStatus, PriorityLevel } from '../../types';
import { AlertTriangle, AlertCircle, CheckCircle2, TrendingUp, Clock, ShieldCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: StockStatus | PriorityLevel;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] font-medium tracking-tight font-sans'
      : 'px-2.5 py-1 text-xs font-medium tracking-tight font-sans';

  switch (status) {
    case 'CRITICAL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded bg-[#FDF3F1] text-[#CB3520] border border-[#F6CCC5] ${sizeClasses}`}
        >
          {showIcon && (
            <AlertTriangle
              className={size === 'sm' ? 'w-3 h-3 text-[#E74732]' : 'w-3.5 h-3.5 text-[#E74732]'}
            />
          )}
          <span>Critical Shortage</span>
        </span>
      );

    case 'LOW_STOCK':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded bg-[#FEF9EF] text-[#9C6614] border border-[#FAE0AD] ${sizeClasses}`}
        >
          {showIcon && (
            <AlertCircle
              className={size === 'sm' ? 'w-3 h-3 text-[#C4841D]' : 'w-3.5 h-3.5 text-[#C4841D]'}
            />
          )}
          <span>Low Stock</span>
        </span>
      );

    case 'EXPIRING_SOON':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded bg-[#F7F5F0] text-[#4A4A46] border border-[#D5D3CC] ${sizeClasses}`}
        >
          {showIcon && (
            <Clock
              className={size === 'sm' ? 'w-3 h-3 text-[#5A5954]' : 'w-3.5 h-3.5 text-[#5A5954]'}
            />
          )}
          <span>Expiring Soon</span>
        </span>
      );

    case 'SURPLUS':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded bg-[#F5F5F3] text-[#383835] border border-[#D1D1CC] ${sizeClasses}`}
        >
          {showIcon && (
            <TrendingUp
              className={size === 'sm' ? 'w-3 h-3 text-[#4A4A46]' : 'w-3.5 h-3.5 text-[#4A4A46]'}
            />
          )}
          <span>Surplus Available</span>
        </span>
      );

    case 'OPTIMAL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded bg-[#F0F7F4] text-[#175641] border border-[#C0DFD4] ${sizeClasses}`}
        >
          {showIcon && (
            <CheckCircle2
              className={size === 'sm' ? 'w-3 h-3 text-[#1D7055]' : 'w-3.5 h-3.5 text-[#1D7055]'}
            />
          )}
          <span>Optimal Reserve</span>
        </span>
      );

    case 'HIGH':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded bg-[#FDF3F1] text-[#CB3520] border border-[#F6CCC5] ${sizeClasses}`}
        >
          {showIcon && (
            <AlertCircle
              className={size === 'sm' ? 'w-3 h-3 text-[#E74732]' : 'w-3.5 h-3.5 text-[#E74732]'}
            />
          )}
          <span>High Priority</span>
        </span>
      );

    case 'MEDIUM':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded bg-[#F5F5F3] text-[#4A4A46] border border-[#E5E3DC] ${sizeClasses}`}
        >
          {showIcon && (
            <ShieldCheck
              className={size === 'sm' ? 'w-3 h-3 text-[#4A4A46]' : 'w-3.5 h-3.5 text-[#4A4A46]'}
            />
          )}
          <span>Standard Priority</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded bg-[#F7F5F0] text-[#4A4A46] border border-[#D5D3CC] ${sizeClasses}`}
        >
          {status}
        </span>
      );
  }
};

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
          className={`inline-flex items-center gap-1.5 rounded-md bg-[#FDF3F3] text-[#BB232B] border border-[#F5CACD] ${sizeClasses}`}
        >
          {showIcon && (
            <AlertTriangle
              className={size === 'sm' ? 'w-3 h-3 text-[#BB232B]' : 'w-3.5 h-3.5 text-[#BB232B]'}
            />
          )}
          <span>Critical Shortage</span>
        </span>
      );

    case 'LOW_STOCK':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-[#FEF9EF] text-[#B87A14] border border-[#FAE0AD] ${sizeClasses}`}
        >
          {showIcon && (
            <AlertCircle
              className={size === 'sm' ? 'w-3 h-3 text-[#B87A14]' : 'w-3.5 h-3.5 text-[#B87A14]'}
            />
          )}
          <span>Low Stock</span>
        </span>
      );

    case 'EXPIRING_SOON':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-[#F5F5F7] text-[#737373] border border-[#E5E5E8] ${sizeClasses}`}
        >
          {showIcon && (
            <Clock
              className={size === 'sm' ? 'w-3 h-3 text-[#737373]' : 'w-3.5 h-3.5 text-[#737373]'}
            />
          )}
          <span>Expiring Soon</span>
        </span>
      );

    case 'SURPLUS':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-[#F0F1FA] text-[#2C3480] border border-[#C7CAEB] font-semibold ${sizeClasses}`}
        >
          {showIcon && (
            <TrendingUp
              className={size === 'sm' ? 'w-3 h-3 text-[#2C3480]' : 'w-3.5 h-3.5 text-[#2C3480]'}
            />
          )}
          <span>Surplus Available</span>
        </span>
      );

    case 'OPTIMAL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-[#F0F8F5] text-[#16815D] border border-[#BFDFD2] ${sizeClasses}`}
        >
          {showIcon && (
            <CheckCircle2
              className={size === 'sm' ? 'w-3 h-3 text-[#16815D]' : 'w-3.5 h-3.5 text-[#16815D]'}
            />
          )}
          <span>Optimal Reserve</span>
        </span>
      );

    case 'HIGH':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-[#FDF3F3] text-[#BB232B] border border-[#F5CACD] ${sizeClasses}`}
        >
          {showIcon && (
            <AlertCircle
              className={size === 'sm' ? 'w-3 h-3 text-[#BB232B]' : 'w-3.5 h-3.5 text-[#BB232B]'}
            />
          )}
          <span>High Priority</span>
        </span>
      );

    case 'MEDIUM':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-[#F5F5F7] text-[#737373] border border-[#E5E5E8] ${sizeClasses}`}
        >
          {showIcon && (
            <ShieldCheck
              className={size === 'sm' ? 'w-3 h-3 text-[#737373]' : 'w-3.5 h-3.5 text-[#737373]'}
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

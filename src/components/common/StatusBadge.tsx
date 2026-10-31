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
          className={`inline-flex items-center gap-1.5 rounded-md bg-[#BB232B]/20 text-[#FF6B72] border border-[#BB232B]/50 ${sizeClasses}`}
        >
          {showIcon && (
            <AlertTriangle
              className={size === 'sm' ? 'w-3 h-3 text-[#FF6B72]' : 'w-3.5 h-3.5 text-[#FF6B72]'}
            />
          )}
          <span>Critical Shortage</span>
        </span>
      );

    case 'LOW_STOCK':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-[#B87A14]/20 text-[#F5CB7A] border border-[#B87A14]/50 ${sizeClasses}`}
        >
          {showIcon && (
            <AlertCircle
              className={size === 'sm' ? 'w-3 h-3 text-[#F5CB7A]' : 'w-3.5 h-3.5 text-[#F5CB7A]'}
            />
          )}
          <span>Low Stock</span>
        </span>
      );

    case 'EXPIRING_SOON':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-[#222431] text-[#A0A0AA] border border-[#2D3142] ${sizeClasses}`}
        >
          {showIcon && (
            <Clock
              className={size === 'sm' ? 'w-3 h-3 text-[#A0A0AA]' : 'w-3.5 h-3.5 text-[#A0A0AA]'}
            />
          )}
          <span>Expiring Soon</span>
        </span>
      );

    case 'SURPLUS':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-[#2C3480]/30 text-[#A4AADE] border border-[#2C3480]/60 font-semibold ${sizeClasses}`}
        >
          {showIcon && (
            <TrendingUp
              className={size === 'sm' ? 'w-3 h-3 text-[#A4AADE]' : 'w-3.5 h-3.5 text-[#A4AADE]'}
            />
          )}
          <span>Surplus Available</span>
        </span>
      );

    case 'OPTIMAL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-[#16815D]/20 text-[#5AA98C] border border-[#16815D]/50 ${sizeClasses}`}
        >
          {showIcon && (
            <CheckCircle2
              className={size === 'sm' ? 'w-3 h-3 text-[#5AA98C]' : 'w-3.5 h-3.5 text-[#5AA98C]'}
            />
          )}
          <span>Optimal Reserve</span>
        </span>
      );

    case 'HIGH':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-[#BB232B]/20 text-[#FF6B72] border border-[#BB232B]/50 ${sizeClasses}`}
        >
          {showIcon && (
            <AlertCircle
              className={size === 'sm' ? 'w-3 h-3 text-[#FF6B72]' : 'w-3.5 h-3.5 text-[#FF6B72]'}
            />
          )}
          <span>High Priority</span>
        </span>
      );

    case 'MEDIUM':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md bg-[#222431] text-[#A0A0AA] border border-[#2D3142] ${sizeClasses}`}
        >
          {showIcon && (
            <ShieldCheck
              className={size === 'sm' ? 'w-3 h-3 text-[#A0A0AA]' : 'w-3.5 h-3.5 text-[#A0A0AA]'}
            />
          )}
          <span>Standard Priority</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded bg-[#222431] text-[#A0A0AA] border border-[#2D3142] ${sizeClasses}`}
        >
          {status}
        </span>
      );
  }
};

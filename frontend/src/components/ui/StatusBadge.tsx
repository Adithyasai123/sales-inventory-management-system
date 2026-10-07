import React from 'react';
import { cn } from '../../lib/utils';
import { OrderStatus } from '../../types/order';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  AlertCircle,
  Ban,
} from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  size = 'md',
}) => {
  const normStatus = status ? status.toUpperCase() : '';

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1 font-medium',
    md: 'text-caption px-3 py-1 gap-1.5 font-medium',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  switch (normStatus) {
    case 'PENDING_APPROVAL':
    case 'PENDING':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 select-none whitespace-nowrap shrink-0',
            sizeClasses[size],
            className
          )}
        >
          <Clock className={cn(iconSizes[size], 'text-amber-600 dark:text-amber-400 shrink-0')} />
          <span className="whitespace-nowrap">Pending Approval</span>
        </span>
      );

    case 'APPROVED':
    case 'COMPLETED':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 select-none whitespace-nowrap shrink-0',
            sizeClasses[size],
            className
          )}
        >
          <CheckCircle2 className={cn(iconSizes[size], 'text-emerald-600 dark:text-emerald-400 shrink-0')} />
          <span className="whitespace-nowrap">{normStatus === 'COMPLETED' ? 'Completed' : 'Approved'}</span>
        </span>
      );

    case 'REJECTED':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 select-none whitespace-nowrap shrink-0',
            sizeClasses[size],
            className
          )}
        >
          <XCircle className={cn(iconSizes[size], 'text-rose-600 dark:text-rose-400 shrink-0')} />
          <span className="whitespace-nowrap">Rejected</span>
        </span>
      );

    case 'CANCELLED':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 select-none whitespace-nowrap shrink-0',
            sizeClasses[size],
            className
          )}
        >
          <Ban className={cn(iconSizes[size], 'text-rose-600 dark:text-rose-400 shrink-0')} />
          <span className="whitespace-nowrap">Cancelled</span>
        </span>
      );

    case 'DRAFT':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-surfaceAlt text-muted border border-border select-none whitespace-nowrap shrink-0',
            sizeClasses[size],
            className
          )}
        >
          <FileEdit className={cn(iconSizes[size], 'text-muted shrink-0')} />
          <span className="whitespace-nowrap">Draft</span>
        </span>
      );

    default:
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-surfaceAlt text-text border border-border select-none whitespace-nowrap shrink-0',
            sizeClasses[size],
            className
          )}
        >
          <AlertCircle className={cn(iconSizes[size], 'text-muted shrink-0')} />
          <span className="whitespace-nowrap">{status}</span>
        </span>
      );
  }
};

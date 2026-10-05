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
  const normStatus = status.toUpperCase();

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1 font-medium',
    md: 'text-xs px-3 py-1 gap-1.5 font-medium',
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
            'inline-flex items-center rounded-full bg-white text-forest border border-dashed border-forest-border select-none shadow-flat',
            sizeClasses[size],
            className
          )}
        >
          <Clock className={cn(iconSizes[size], 'text-forest-muted')} />
          <span>Pending Approval</span>
        </span>
      );

    case 'APPROVED':
    case 'COMPLETED':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-mint-primary text-forest-dark border border-mint select-none',
            sizeClasses[size],
            className
          )}
        >
          <CheckCircle2 className={cn(iconSizes[size], 'text-forest-dark')} />
          <span>{normStatus === 'COMPLETED' ? 'Completed' : 'Approved'}</span>
        </span>
      );

    case 'REJECTED':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-forest text-mint-primary border border-forest select-none',
            sizeClasses[size],
            className
          )}
        >
          <XCircle className={cn(iconSizes[size], 'text-mint-primary')} />
          <span>Rejected</span>
        </span>
      );

    case 'CANCELLED':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-forest text-mint-200 border border-forest select-none',
            sizeClasses[size],
            className
          )}
        >
          <Ban className={cn(iconSizes[size], 'text-mint-200')} />
          <span>Cancelled</span>
        </span>
      );

    case 'DRAFT':
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-forest-surface text-forest-muted border border-forest-border select-none',
            sizeClasses[size],
            className
          )}
        >
          <FileEdit className={cn(iconSizes[size], 'text-forest-muted')} />
          <span>Draft</span>
        </span>
      );

    default:
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-white text-forest border border-forest-border select-none',
            sizeClasses[size],
            className
          )}
        >
          <AlertCircle className={cn(iconSizes[size], 'text-forest-muted')} />
          <span>{status}</span>
        </span>
      );
  }
};

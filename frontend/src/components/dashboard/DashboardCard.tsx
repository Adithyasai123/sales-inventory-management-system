import React from 'react';
import { cn } from '../../lib/utils';
import { RefreshCw, MoreHorizontal } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import { Illustration } from '../ui/Illustration';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
  fixedHeight?: boolean;
  showTopAccent?: boolean;
  children: React.ReactNode;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  action,
  className,
  contentClassName,
  isLoading = false,
  isError = false,
  onRetry,
  isEmpty = false,
  emptyIcon,
  emptyMessage = 'No sales in this range',
  fixedHeight = true,
  showTopAccent = false,
  children,
}) => {
  return (
    <div
      className={cn(
        'bg-surface rounded-card border border-border p-6 shadow-card flex flex-col justify-between select-none relative overflow-hidden',
        className
      )}
    >
      {/* 3px Primary Top Accent (Optional) */}
      {showTopAccent && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary" />
      )}

      {/* Card Header Row */}
      <div className="flex items-center justify-between gap-2 mb-4 shrink-0">
        <div className="min-w-0">
          <h2 className="text-title leading-tight truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-caption mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {action ? (
          <div className="shrink-0">{action}</div>
        ) : (
          <button
            type="button"
            className="p-1.5 rounded-btn hover:bg-surfaceAlt text-muted hover:text-text transition-colors shrink-0"
            aria-label="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Card Body */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0',
          fixedHeight ? 'h-[220px] sm:h-[230px]' : 'h-auto',
          contentClassName
        )}
      >
        {isLoading ? (
          <div className="flex-1 flex flex-col justify-center gap-3 py-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-28 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
            <Illustration name="state-connection-error" size={84} wrapTile={false} alt="Connection error" />
            <p className="text-subtitle mt-1 text-text">Connection Issue</p>
            <p className="text-caption mt-0.5 text-muted">Unable to load data. Please retry.</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 text-btn rounded-pill bg-surfaceAlt text-text hover:bg-border transition-colors border border-border"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            )}
          </div>
        ) : isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
            {emptyIcon || <Illustration name="state-empty-chart" size={96} wrapTile={false} alt="Empty chart" />}
            <p className="text-body-lg text-muted max-w-[260px] mt-1">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

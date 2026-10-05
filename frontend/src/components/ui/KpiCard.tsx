import React from 'react';
import { cn } from '../../lib/utils';
import { Skeleton } from './Skeleton';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  isHero?: boolean;
  isLoading?: boolean;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  isHero = false,
  isLoading = false,
  trend,
}) => {
  return (
    <div
      className={cn(
        'rounded-card p-5 border flex flex-col justify-between transition-all duration-150',
        isHero
          ? 'bg-mint-primary text-forest-dark border-mint'
          : 'bg-white text-forest border-forest-border shadow-flat'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            'text-xs font-medium tracking-wide uppercase',
            isHero ? 'text-forest-dark/80' : 'text-forest-muted'
          )}
        >
          {title}
        </span>
        <div
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
            isHero ? 'bg-white/40 text-forest-dark' : 'bg-forest-surface text-forest'
          )}
        >
          {icon}
        </div>
      </div>

      <div className="mt-1">
        {isLoading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <div className="font-serif text-3xl font-medium tabular-nums tracking-tight">
            {value}
          </div>
        )}

        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            {trend && (
              <span
                className={cn(
                  'font-medium px-2 py-0.5 rounded-full',
                  isHero
                    ? 'bg-white/60 text-forest-dark'
                    : 'bg-forest-surface text-forest-muted'
                )}
              >
                {trend.value}
              </span>
            )}
            {subtitle && (
              <span className={isHero ? 'text-forest-dark/70' : 'text-forest-muted'}>
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

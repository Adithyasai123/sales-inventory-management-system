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
          ? 'bg-primary text-primaryText border-primary/50'
          : 'bg-surface text-text border-border shadow-card'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            'text-label',
            isHero ? 'text-primaryText/80' : 'text-muted'
          )}
        >
          {title}
        </span>
        <div
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
            isHero ? 'bg-primaryText/10 text-primaryText' : 'bg-surfaceAlt text-text'
          )}
        >
          {icon}
        </div>
      </div>

      <div className="mt-1">
        {isLoading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <div className="text-kpi">
            {value}
          </div>
        )}

        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-2 text-caption">
            {trend && (
              <span
                className={cn(
                  ' px-2 py-0.5 rounded-full',
                  isHero
                    ? 'bg-primaryText/15 text-primaryText'
                    : 'bg-surfaceAlt text-muted'
                )}
              >
                {trend.value}
              </span>
            )}
            {subtitle && (
              <span className={isHero ? 'text-primaryText/70' : 'text-muted'}>
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

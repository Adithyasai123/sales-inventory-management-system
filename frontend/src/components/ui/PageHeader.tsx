import React from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6',
        className
      )}
    >
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-medium text-forest tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-forest-muted mt-1 max-w-xl">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
};

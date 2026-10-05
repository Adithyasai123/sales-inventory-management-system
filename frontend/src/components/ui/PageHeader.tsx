import React from 'react';
import { cn } from '../../lib/utils';
import { Illustration, IllustrationName } from './Illustration';

export type PageHeroType = IllustrationName | string;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  hero?: PageHeroType;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  hero,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center md:justify-between gap-4',
        className
      )}
    >
      <div className="flex items-center gap-6 justify-between w-full md:w-auto">
        <div>
          <h1 className="text-display text-text">
            {title}
          </h1>
          {subtitle && (
            <p className="text-body-lg text-muted mt-1 max-w-xl">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end w-full md:w-auto">
        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
      </div>
    </div>
  );
};

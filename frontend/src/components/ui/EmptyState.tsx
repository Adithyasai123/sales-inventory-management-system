import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { Illustration, IllustrationName } from './Illustration';

interface EmptyStateProps {
  illustration?: IllustrationName | string;
  animation?: string; // Legacy fallback mapping
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  illustration,
  animation,
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  // Map legacy animation names to illustration names
  let resolvedIllustration: IllustrationName = 'state-no-data';
  const nameToMap = illustration || animation;

  if (nameToMap) {
    if (nameToMap.startsWith('state-') || nameToMap.startsWith('page-')) {
      resolvedIllustration = nameToMap as IllustrationName;
    } else if (nameToMap === 'empty-search') {
      resolvedIllustration = 'state-empty-search';
    } else if (nameToMap === 'empty-cart') {
      resolvedIllustration = 'state-empty-cart';
    } else if (nameToMap === 'empty-chart') {
      resolvedIllustration = 'state-empty-chart';
    } else if (nameToMap === 'all-caught-up') {
      resolvedIllustration = 'state-all-caught-up';
    } else if (nameToMap === 'alert') {
      resolvedIllustration = 'state-healthy-stock';
    } else if (nameToMap === 'error') {
      resolvedIllustration = 'state-connection-error';
    } else if (nameToMap === 'success') {
      resolvedIllustration = 'state-success';
    } else if (nameToMap === 'not-found') {
      resolvedIllustration = 'page-404';
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 text-center rounded-card bg-surface border border-border shadow-card',
        className
      )}
    >
      <div className="mb-4 flex items-center justify-center">
        {icon ? (
          <div className="w-16 h-16 rounded-full bg-surfaceAlt flex items-center justify-center text-muted">
            {icon}
          </div>
        ) : (
          <Illustration name={resolvedIllustration} size={150} alt={title} wrapTile={true} />
        )}
      </div>
      <h3 className="text-title mb-1.5 text-text">{title}</h3>
      <p className="text-body-lg text-muted max-w-md mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

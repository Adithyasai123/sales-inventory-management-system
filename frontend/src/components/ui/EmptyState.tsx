import React from 'react';
import { cn } from '../../lib/utils';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-card bg-white border border-forest-border',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-forest-surface flex items-center justify-center text-forest-muted mb-3">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="font-serif text-lg font-medium text-forest mb-1">{title}</h3>
      <p className="text-xs text-forest-muted max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

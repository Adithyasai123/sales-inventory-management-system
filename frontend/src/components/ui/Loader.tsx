import React from 'react';
import { cn } from '../../lib/utils';
import { SimsLogo } from './SimsLogo';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  colorClassName?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
  colorClassName = 'border-accent border-t-transparent',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
    xl: 'w-14 h-14 border-4',
  };

  return (
    <div
      className={cn(
        'rounded-full animate-spin shrink-0',
        sizeClasses[size],
        colorClassName,
        className
      )}
      role="status"
      aria-label="Loading..."
    />
  );
};

export interface PulseDotsProps {
  className?: string;
}

export const PulseDots: React.FC<PulseDotsProps> = ({ className }) => {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 rounded-full bg-accent animate-bounce" />
    </div>
  );
};

export interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading workspace...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/85 backdrop-blur-sm animate-fadeIn">
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex items-center justify-center w-11 h-11">
          <div className="absolute inset-0 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
          <SimsLogo size={22} className="opacity-90" />
        </div>
        {message && (
          <p className="text-xs font-medium text-textMuted tracking-wider uppercase">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export interface GlassCardLoaderProps {
  lines?: number;
  className?: string;
}

export const GlassCardLoader: React.FC<GlassCardLoaderProps> = ({ lines = 3, className }) => {
  return (
    <div
      className={cn(
        'p-6 rounded-card bg-surfaceAlt/50 border border-border/80 shadow-card animate-pulse space-y-4',
        className
      )}
    >
      <div className="h-5 bg-primarySoft/60 rounded-md w-1/3" />
      {Array.from({ length: lines }).map((_, idx) => (
        <div key={idx} className="h-4 bg-primarySoft/40 rounded-md w-full" />
      ))}
    </div>
  );
};

import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, shimmer = true, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-input bg-zinc-200/90 dark:bg-zinc-800/85 transition-all duration-200 relative overflow-hidden',
        shimmer
          ? 'animate-pulse before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/30 dark:before:via-white/8 before:to-transparent'
          : 'animate-pulse',
        className
      )}
      {...props}
    />
  );
};

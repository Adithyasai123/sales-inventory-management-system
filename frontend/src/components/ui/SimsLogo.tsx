import React from 'react';
import { cn } from '../../lib/utils';

interface SimsLogoProps {
  size?: number;
  className?: string;
}

export const SimsLogo: React.FC<SimsLogoProps> = ({ size = 32, className }) => {
  const iconSize = Math.round(size * 0.62);

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'rounded-[8px] bg-primary flex items-center justify-center shrink-0 shadow-card select-none',
        className
      )}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-accent"
      >
        <path
          d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
          fill="currentColor"
          fillOpacity="0.2"
        />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    </div>
  );
};

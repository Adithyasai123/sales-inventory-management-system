import React from 'react';
import { cn } from '../../lib/utils';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
  className,
  id,
}) => {
  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      onChange(!checked);
    }
  };

  // Dimensions, thumb size, and exact translateX distance in pixels
  const sizeConfig = {
    sm: {
      track: 'w-8 h-[18px]',
      thumb: 'w-3.5 h-3.5',
      translateX: 14,
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translateX: 20,
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translateX: 28,
    },
  }[size];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 select-none',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className
      )}
    >
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === ' ' || e.key === 'Enter') {
            handleToggle(e);
          }
        }}
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          sizeConfig.track,
          checked
            ? 'bg-emerald-600 dark:bg-emerald-500'
            : 'bg-zinc-300 dark:bg-zinc-700'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out',
            sizeConfig.thumb
          )}
          style={{
            transform: checked ? `translateX(${sizeConfig.translateX}px)` : 'translateX(0px)',
          }}
        />
      </button>

      {(label || description) && (
        <div
          className={cn('flex flex-col text-left select-none', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
          onClick={handleToggle}
        >
          {label && (
            <span
              className={cn(
                'text-xs font-medium leading-none text-text',
                disabled && 'text-muted'
              )}
            >
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-muted mt-0.5 leading-tight">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

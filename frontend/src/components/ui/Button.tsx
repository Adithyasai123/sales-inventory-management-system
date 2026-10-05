import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'forest' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center text-btn transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    // Primary action button: ink/accent fill with white/dark text, 8px radius
    primary:
      'bg-navActive text-navActiveText hover:opacity-95 border border-transparent shadow-card rounded-btn',
    // Alias for primary
    forest:
      'bg-navActive text-navActiveText hover:opacity-95 border border-transparent shadow-card rounded-btn',
    // Secondary outline button: 1px border, text-label uppercase, 6px radius
    outline:
      'bg-transparent text-text border border-border hover:bg-surfaceAlt text-label rounded-btn-sm',
    // Ghost button
    ghost:
      'bg-transparent text-text hover:bg-surfaceAlt text-btn rounded-btn',
    // Destructive action
    danger:
      'bg-danger text-accentText border border-transparent shadow-card rounded-btn',
  };

  const sizes = {
    sm: 'h-8 text-[12px] px-3 gap-1.5 leading-none uppercase tracking-[0.04em]',
    md: 'h-10 text-[14px] px-4 gap-2 leading-tight',
    lg: 'h-12 text-[16px] px-6 gap-2.5 leading-tight',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="inline-flex shrink-0">{rightIcon}</span>
      )}
    </button>
  );
};

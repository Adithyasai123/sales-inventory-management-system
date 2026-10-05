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
    'inline-flex items-center justify-center font-medium rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-forest-muted focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    // Soft, low-contrast mint primary with deep-forest text
    primary:
      'bg-mint-primary text-forest-dark hover:bg-mint-200 border border-transparent shadow-flat',
    // Forest ink button
    forest:
      'bg-forest text-mint-primary hover:bg-forest-dark border border-transparent shadow-flat',
    // Outline button
    outline:
      'bg-transparent text-forest border border-forest-border hover:bg-forest-surface',
    // Ghost button
    ghost:
      'bg-transparent text-forest hover:bg-forest-surface hover:text-forest-dark',
    // Destructive action
    danger:
      'bg-forest text-mint-200 border border-forest-dark hover:bg-forest-dark',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-2.5 gap-2.5',
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

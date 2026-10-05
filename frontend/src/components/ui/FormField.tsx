import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  required,
  className,
  children,
}) => {
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label className="text-caption text-body flex items-center gap-1">
          {label}
          {required && <span className="text-danger">*</span>}
        </label>
      )}

      {children}

      {error ? (
        <div className="flex items-center gap-1.5 text-caption text-danger mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 text-danger shrink-0" />
          <span className="">{error}</span>
        </div>
      ) : helperText ? (
        <p className="text-caption mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full px-3.5 py-2 text-body bg-bg text-text placeholder:text-muted/60 border rounded-input transition-colors duration-150',
          'border-border focus:outline-none focus:border-chart1 focus:ring-1 focus:ring-chart1',
          hasError && 'border-danger ring-1 ring-danger',
          props.disabled && 'bg-surfaceAlt text-muted/60 cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full px-3.5 py-2 text-body bg-bg text-text border rounded-input transition-colors duration-150',
          'border-border focus:outline-none focus:border-chart1 focus:ring-1 focus:ring-chart1',
          hasError && 'border-danger ring-1 ring-danger',
          props.disabled && 'bg-surfaceAlt text-muted/60 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full px-3.5 py-2 text-body bg-bg text-text placeholder:text-muted/60 border rounded-input transition-colors duration-150 min-h-[80px]',
          'border-border focus:outline-none focus:border-chart1 focus:ring-1 focus:ring-chart1',
          hasError && 'border-danger ring-1 ring-danger',
          props.disabled && 'bg-surfaceAlt text-muted/60 cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

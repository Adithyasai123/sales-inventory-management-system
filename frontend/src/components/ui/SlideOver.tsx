import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-forest/40 backdrop-blur-sm transition-opacity duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
        <div
          className={cn(
            'w-screen bg-white shadow-xl pointer-events-auto border-l border-forest-border flex flex-col transition-transform duration-150 ease-in-out',
            widthClasses[width]
          )}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-forest-border flex items-start justify-between bg-forest-surface/60">
            <div>
              <h2 className="font-serif text-xl font-medium text-forest">{title}</h2>
              {subtitle && (
                <p className="text-xs text-forest-muted mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-forest-muted hover:text-forest p-1.5 rounded-full hover:bg-forest-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

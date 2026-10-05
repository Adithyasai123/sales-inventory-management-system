import React, { useEffect } from 'react';
import { Button } from './Button';
import { X, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'forest' | 'danger';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-card border border-forest-border shadow-flat p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-forest-surface flex items-center justify-center text-forest shrink-0">
              <AlertCircle className="w-4 h-4 text-forest" />
            </div>
            <h3 className="font-serif text-lg font-medium text-forest">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-forest-muted hover:text-forest transition-colors p-1 rounded-full hover:bg-forest-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-forest-muted leading-relaxed">{description}</p>

        {children && <div className="my-1">{children}</div>}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-forest-border/60">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

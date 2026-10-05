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

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const showFooterButtons = Boolean(confirmLabel && confirmLabel.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside backdrop to close */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div
        className="relative z-10 w-full max-w-md bg-surface rounded-card border border-border shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-surfaceAlt flex items-center justify-center text-text shrink-0">
              <AlertCircle className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-title font-semibold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors p-1.5 rounded-full hover:bg-surfaceAlt"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {description && <p className="text-caption leading-relaxed text-muted">{description}</p>}

        {children && <div className="my-1">{children}</div>}

        {showFooterButtons && (
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            {cancelLabel && (
              <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
                {cancelLabel}
              </Button>
            )}
            <Button
              variant={variant}
              size="sm"
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

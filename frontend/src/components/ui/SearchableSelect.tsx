import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SearchableSelectProps {
  label?: string;
  description?: string;
  value?: string | number;
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  minSearchCount?: number; // Show search input if options count >= minSearchCount (default 4)
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  description,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search options...',
  disabled = false,
  required = false,
  error,
  className,
  minSearchCount = 4,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Filter options based on search term
  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const labelMatch = opt.label.toLowerCase().includes(term);
    const descMatch = opt.description ? opt.description.toLowerCase().includes(term) : false;
    const badgeMatch = opt.badge ? opt.badge.toLowerCase().includes(term) : false;
    return labelMatch || descMatch || badgeMatch;
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Close on Escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      e.stopPropagation();
      setIsOpen(false);
    }
  };

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
  };

  const showSearch = options.length >= minSearchCount;

  return (
    <div
      ref={containerRef}
      className={cn('relative flex flex-col gap-1.5 w-full text-left select-none', className)}
      onKeyDown={handleKeyDown}
    >
      {/* Label and description */}
      {label && (
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-text flex items-center gap-1">
            <span>{label}</span>
            {required && <span className="text-danger font-bold">*</span>}
          </label>
          {description && (
            <span className="text-[11px] text-muted leading-tight mt-0.5">{description}</span>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'w-full min-h-[42px] px-3.5 py-2 rounded-xl border text-sm flex items-center justify-between gap-2.5 transition-all outline-none',
          'bg-surface hover:bg-surfaceAlt/60 text-text',
          isOpen
            ? 'border-accent ring-2 ring-accent/20 bg-surface'
            : 'border-border hover:border-text/30',
          error && 'border-danger focus:ring-danger/20',
          disabled && 'opacity-50 cursor-not-allowed bg-surfaceAlt'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <selectedOption.icon className="w-4 h-4 text-accent shrink-0" />
              )}
              <span className="font-medium text-text truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider',
                    selectedOption.badgeColor || 'bg-accent/10 text-accent border border-accent/20'
                  )}
                >
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted text-sm">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted shrink-0 transition-transform duration-200',
            isOpen && 'transform rotate-180 text-accent'
          )}
        />
      </button>

      {/* Error Message */}
      {error && <span className="text-caption text-danger mt-0.5">{error}</span>}

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
          role="listbox"
        >
          {/* Search Input */}
          {showSearch && (
            <div className="p-2.5 border-b border-border bg-surfaceAlt/50">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-muted absolute left-3 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg bg-surface border border-border text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 text-muted hover:text-text p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                const Icon = opt.icon;
                return (
                  <div
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-colors',
                      isSelected
                        ? 'bg-accent/10 text-accent font-semibold'
                        : 'text-text hover:bg-surfaceAlt'
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2.5 pr-2 truncate">
                      {Icon && (
                        <div
                          className={cn(
                            'p-1.5 rounded-lg shrink-0',
                            isSelected
                              ? 'bg-accent text-accentText'
                              : 'bg-surfaceAlt text-textMuted'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="flex flex-col truncate">
                        <div className="flex items-center gap-2">
                          <span className={cn('truncate', isSelected && 'font-semibold')}>
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span
                              className={cn(
                                'px-1.5 py-0.2 rounded text-[10px] uppercase font-bold shrink-0',
                                opt.badgeColor || 'bg-surfaceAlt text-muted border border-border'
                              )}
                            >
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <span className="text-[11px] text-muted truncate mt-0.5">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-accent shrink-0 ml-2" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-xs text-muted">
                No options found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

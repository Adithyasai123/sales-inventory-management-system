import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Skeleton } from './Skeleton';

export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  stockText?: string;
  stockColor?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SearchableSelectProps {
  label?: string;
  description?: string;
  value?: string | number | null;
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  minSearchCount?: number;
  isLoading?: boolean;
  isClearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right';
  showBadgeInTrigger?: boolean;
  dropdownWidth?: 'auto' | 'full' | 'wide' | 'sm';
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
  minSearchCount = 3,
  isLoading = false,
  isClearable = false,
  size = 'md',
  align = 'left',
  showBadgeInTrigger = false,
  dropdownWidth = 'full',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value]
  );

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter((opt) => {
      const labelMatch = opt.label.toLowerCase().includes(term);
      const descMatch = opt.description ? opt.description.toLowerCase().includes(term) : false;
      const badgeMatch = opt.badge ? opt.badge.toLowerCase().includes(term) : false;
      return labelMatch || descMatch || badgeMatch;
    });
  }, [options, searchTerm]);

  // Dynamic positioning: open upwards if not enough space below
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 300 && spaceAbove > spaceBelow) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [isOpen]);

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

  // Focus search input on open and reset highlight
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 40);
    } else {
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Auto-scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsListRef.current) {
      const activeEl = optionsListRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
        return next;
      });
    } else if (e.key === 'Enter' && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
      e.preventDefault();
      handleSelect(filteredOptions[highlightedIndex].value);
    }
  };

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const showSearch = options.length >= minSearchCount;

  // Size styling variants
  const sizeClasses = {
    sm: 'h-9 px-3 text-xs rounded-xl',
    md: 'h-10 px-3.5 text-sm rounded-xl',
    lg: 'h-12 px-4 text-base rounded-2xl',
  };

  // Skeleton state when loading
  if (isLoading && !options.length) {
    return (
      <div className={cn('flex flex-col gap-1.5 w-full select-none', className)}>
        {label && (
          <div className="flex items-center gap-1">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            {required && <span className="text-danger font-bold">*</span>}
          </div>
        )}
        <div
          className={cn(
            'w-full flex items-center justify-between border border-border bg-surface shadow-xs',
            sizeClasses[size]
          )}
        >
          <div className="flex items-center gap-2 flex-1">
            <Skeleton className={cn('h-3.5 w-32 rounded-md', size === 'sm' && 'h-3 w-24')} />
          </div>
          <Loader2 className="w-3.5 h-3.5 text-muted animate-spin shrink-0" />
        </div>
      </div>
    );
  }

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
          'w-full border flex items-center justify-between gap-2.5 transition-all outline-none shadow-xs group',
          'bg-surface hover:bg-surfaceAlt/60 text-text cursor-pointer',
          sizeClasses[size],
          isOpen
            ? 'border-accent ring-2 ring-accent/20 bg-surface'
            : 'border-border/80 hover:border-text/40',
          error && 'border-danger focus:ring-danger/20',
          disabled && 'opacity-50 cursor-not-allowed bg-surfaceAlt'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <selectedOption.icon className="w-4 h-4 text-accent shrink-0" />
              )}
              <span className="font-medium text-text truncate text-xs sm:text-sm">
                {selectedOption.label}
              </span>
              {showBadgeInTrigger && selectedOption.badge && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 shadow-xs',
                    selectedOption.badgeColor || 'bg-accent/10 text-accent border border-accent/20'
                  )}
                >
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted/80 truncate text-xs sm:text-sm">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {isClearable && selectedOption && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-1 rounded-md text-muted hover:text-text hover:bg-surfaceAlt cursor-pointer transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-muted group-hover:text-text transition-colors">
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                isOpen && 'transform rotate-180 text-accent'
              )}
            />
          </div>
        </div>
      </button>

      {/* Error Message */}
      {error && <span className="text-caption text-danger mt-0.5">{error}</span>}

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 rounded-2xl bg-surface border border-border/90 shadow-2xl overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150',
            openUpwards ? 'bottom-full mb-2' : 'top-full mt-2',
            dropdownWidth === 'wide'
              ? 'w-full min-w-[320px] sm:min-w-[460px] max-w-[min(580px,94vw)]'
              : dropdownWidth === 'sm'
              ? 'w-full min-w-[200px] max-w-xs'
              : 'w-full min-w-[280px] sm:min-w-[380px] max-w-[min(520px,94vw)]',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          role="listbox"
        >
          {/* Integrated Modern Search Header */}
          {showSearch && (
            <div className="px-3.5 py-2.5 border-b border-border/80 flex items-center gap-2.5 bg-surface/95 backdrop-blur-sm sticky top-0 z-10">
              <Search className="w-4 h-4 text-accent shrink-0 ml-0.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent border-0 p-0 text-xs text-text placeholder:text-muted/70 focus:outline-none focus:ring-0 leading-normal"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-muted hover:text-text p-1 rounded-md hover:bg-surfaceAlt transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="text-[10px] text-muted/80 uppercase font-mono px-1.5 py-0.5 rounded bg-surfaceAlt border border-border/60 shrink-0">
                  ESC
                </span>
              )}
            </div>
          )}

          {/* Options List */}
          <div
            ref={optionsListRef}
            className="max-h-64 sm:max-h-72 overflow-y-auto p-1.5 space-y-1 custom-scrollbar"
          >
            {isLoading ? (
              <div className="p-2 space-y-2">
                <Skeleton className="h-8 w-full rounded-xl" />
                <Skeleton className="h-8 w-full rounded-xl" />
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;
                const Icon = opt.icon;

                // Extract stock info if present in description or stockText
                const hasStock0 = opt.description?.includes('Stock: 0') || opt.description?.includes('Stock: 0 ') || opt.stockText?.toLowerCase().includes('out of stock');
                const hasLowStock = !hasStock0 && (opt.description?.includes('Stock: 1 ') || opt.description?.includes('Stock: 2 ') || opt.description?.includes('Stock: 3 ') || opt.description?.includes('Stock: 4 ') || opt.stockText?.toLowerCase().includes('left'));

                return (
                  <div
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-xs transition-all duration-100',
                      isSelected
                        ? 'bg-accent/15 text-accent font-semibold ring-1 ring-accent/30'
                        : isHighlighted
                        ? 'bg-surfaceAlt text-text'
                        : 'text-text hover:bg-surfaceAlt/70'
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-3 pr-2 min-w-0 flex-1">
                      {Icon ? (
                        <div
                          className={cn(
                            'p-2 rounded-xl shrink-0 shadow-xs',
                            isSelected
                              ? 'bg-accent text-accentText'
                              : 'bg-surfaceAlt text-muted border border-border/80'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                      ) : (
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full shrink-0 mt-0.5',
                            hasStock0
                              ? 'bg-rose-500 ring-2 ring-rose-500/20'
                              : hasLowStock
                              ? 'bg-amber-500 ring-2 ring-amber-500/20'
                              : 'bg-emerald-500 ring-2 ring-emerald-500/20'
                          )}
                          title={hasStock0 ? 'Out of Stock' : hasLowStock ? 'Low Stock' : 'In Stock'}
                        />
                      )}

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'truncate text-xs sm:text-sm font-medium',
                              isSelected ? 'text-accent font-bold' : 'text-text'
                            )}
                          >
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-md text-[11px] font-mono font-bold shrink-0 shadow-xs',
                                opt.badgeColor ||
                                  (hasStock0
                                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20')
                              )}
                            >
                              {opt.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          {opt.description && (
                            <span className="text-[11px] text-muted truncate leading-tight flex-1">
                              {opt.description}
                            </span>
                          )}
                          {opt.stockText && (
                            <span
                              className={cn(
                                'px-1.5 py-0.2 rounded text-[10px] font-semibold shrink-0',
                                opt.stockColor || 'bg-surfaceAlt text-muted'
                              )}
                            >
                              {opt.stockText}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 ml-2">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center flex flex-col items-center justify-center text-muted">
                <Search className="w-6 h-6 mb-2 opacity-40 text-muted" />
                <p className="text-xs font-medium text-text">No matching options found</p>
                <p className="text-[11px] text-muted mt-0.5">
                  Try adjusting your search for "{searchTerm}"
                </p>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="mt-2.5 text-xs text-accent hover:underline font-medium"
                  >
                    Clear Search Filter
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

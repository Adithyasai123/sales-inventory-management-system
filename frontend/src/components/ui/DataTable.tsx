import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
} from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data?: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  isLoading?: boolean;
  onPageChange?: (newPage: number) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (field: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAnimation?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRowClick?: (item: T) => void;
  filters?: React.ReactNode;
  leftContent?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data = [],
  total = 0,
  page = 1,
  pageSize = 15,
  totalPages = 1,
  isLoading = false,
  onPageChange,
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortChange,
  emptyTitle,
  emptyDescription,
  emptyAnimation,
  emptyActionLabel,
  onEmptyAction,
  onRowClick,
  filters,
  leftContent,
}: DataTableProps<T>) {
  const isSearching = Boolean(searchValue && searchValue.trim().length > 0);
  const resolvedAnimation: string =
    emptyAnimation || (isSearching ? 'state-empty-search' : 'state-no-data');
  const resolvedTitle =
    emptyTitle || (isSearching ? `No results for "${searchValue}"` : 'No records found');
  const resolvedDescription =
    emptyDescription ||
    (isSearching
      ? 'Try adjusting your search query or clearing active filters.'
      : 'There are no items matching your criteria.');
  const resolvedActionLabel =
    emptyActionLabel || (isSearching && onSearchChange ? 'Clear search' : undefined);
  const resolvedOnAction =
    onEmptyAction || (isSearching && onSearchChange ? () => onSearchChange('') : undefined);

  // Generate smart pagination page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // Realistic skeleton width variation
  const getSkeletonWidth = (rowIndex: number, colIndex: number) => {
    const widths = ['w-3/4', 'w-1/2', 'w-2/3', 'w-4/5', 'w-1/3', 'w-full'];
    const idx = (rowIndex * 3 + colIndex) % widths.length;
    return widths[idx];
  };

  const skeletonRowCount = Math.min(pageSize || 15, 15);

  return (
    <div className="w-full bg-surface rounded-card border border-border shadow-card overflow-hidden flex flex-col">
      {/* Controls Bar */}
      {(onSearchChange || filters || leftContent) && (
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surfaceAlt/50">
          <div className="flex items-center gap-3 flex-1">
            {leftContent && <div>{leftContent}</div>}
            
            {onSearchChange && (
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input
                  type="text"
                  value={searchValue || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3.5 py-1.5 text-caption bg-surface text-text placeholder:text-muted/60 border border-border rounded-input focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
            )}
          </div>

          {filters && <div className="flex items-center justify-end gap-2 flex-wrap ml-auto">{filters}</div>}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-caption text-text border-collapse">
          <thead>
            <tr className="border-b border-border bg-surfaceAlt text-text">
              {columns.map((col) => {
                const isSorted = sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 select-none text-label',
                      col.sortable && 'cursor-pointer hover:text-text',
                      col.className
                    )}
                    onClick={() => col.sortable && onSortChange && onSortChange(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-muted">
                          {isSorted ? (
                            sortOrder === 'desc' ? (
                              <ArrowDown className="w-3 h-3 text-text" />
                            ) : (
                              <ArrowUp className="w-3 h-3 text-text" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              /* 15 Skeleton Loader Rows */
              Array.from({ length: skeletonRowCount }).map((_, rIdx) => (
                <tr key={`skel-row-${rIdx}`} className="hover:bg-transparent">
                  {columns.map((col, cIdx) => (
                    <td key={`skel-col-${cIdx}`} className={cn('px-4 py-3.5', col.className)}>
                      <Skeleton className={cn('h-4 rounded-sm', getSkeletonWidth(rIdx, cIdx))} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <EmptyState
                    animation={resolvedAnimation}
                    title={resolvedTitle}
                    description={resolvedDescription}
                    actionLabel={resolvedActionLabel}
                    onAction={resolvedOnAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={(item as any).id ?? (item as any).product_id ?? idx}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={cn(
                    'transition-colors duration-150',
                    onRowClick && 'cursor-pointer hover:bg-surfaceAlt',
                    !onRowClick && 'hover:bg-surfaceAlt/50'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3', col.className)}>
                      {col.render
                        ? col.render(item)
                        : (item as any)[col.key] !== undefined && (item as any)[col.key] !== null
                        ? String((item as any)[col.key])
                        : '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer with Record Limit & Page Controls */}
      {onPageChange && (
        <div className="px-4 py-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-caption bg-surfaceAlt/40 select-none">
          {/* Records count & limit indicator */}
          <div className="flex items-center gap-2 text-muted text-caption">
            <span>
              Showing{' '}
              <strong className="text-text tabular-nums">
                {total === 0 ? 0 : (page - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-text tabular-nums">
                {Math.min(page * pageSize, total)}
              </strong>{' '}
              of <strong className="text-text tabular-nums">{total}</strong> records
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-surface border border-border text-[10px] font-mono text-muted">
              {pageSize} / page
            </span>
          </div>

          {/* Navigation Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* First Page */}
              <button
                type="button"
                onClick={() => onPageChange(1)}
                disabled={page <= 1 || isLoading}
                className="p-1.5 rounded-input text-muted hover:text-text hover:bg-surface border border-transparent hover:border-border disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="First Page"
                aria-label="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Prev Page */}
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isLoading}
                className="p-1.5 rounded-input text-muted hover:text-text hover:bg-surface border border-transparent hover:border-border disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Previous Page"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Numeric Page Buttons */}
              <div className="flex items-center gap-1 mx-1">
                {getPageNumbers().map((p, pIdx) => {
                  if (typeof p === 'string') {
                    return (
                      <span key={`ellipsis-${pIdx}`} className="px-1.5 text-muted">
                        ...
                      </span>
                    );
                  }

                  const isActive = p === page;
                  return (
                    <button
                      key={`page-${p}`}
                      type="button"
                      onClick={() => onPageChange(p)}
                      disabled={isLoading}
                      className={cn(
                        'min-w-[28px] h-7 px-2 text-caption rounded-input border transition-all tabular-nums flex items-center justify-center',
                        isActive
                          ? 'bg-accent text-accentText border-accent shadow-xs'
                          : 'bg-surface hover:bg-surfaceAlt text-text border-border'
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="p-1.5 rounded-input text-muted hover:text-text hover:bg-surface border border-transparent hover:border-border disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Next Page"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                type="button"
                onClick={() => onPageChange(totalPages)}
                disabled={page >= totalPages || isLoading}
                className="p-1.5 rounded-input text-muted hover:text-text hover:bg-surface border border-transparent hover:border-border disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Last Page"
                aria-label="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import {
  ChevronLeft,
  ChevronRight,
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
  onRowClick?: (item: T) => void;
  filters?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data = [],
  total = 0,
  page = 1,
  pageSize = 20,
  totalPages = 1,
  isLoading = false,
  onPageChange,
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortChange,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your criteria.',
  onRowClick,
  filters,
}: DataTableProps<T>) {
  return (
    <div className="w-full bg-white rounded-card border border-forest-border shadow-flat overflow-hidden flex flex-col">
      {/* Controls Bar */}
      {(onSearchChange || filters) && (
        <div className="p-4 border-b border-forest-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-forest-surface/30">
          {onSearchChange && (
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-muted pointer-events-none" />
              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white text-forest placeholder:text-forest-muted/60 border border-forest-border rounded-input focus:outline-none focus:border-forest-muted focus:ring-1 focus:ring-forest-muted transition-colors"
              />
            </div>
          )}

          {filters && <div className="flex items-center gap-2 flex-wrap">{filters}</div>}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs text-forest border-collapse">
          <thead>
            <tr className="border-b border-forest-border bg-forest-surface/60 text-forest-dark font-medium">
              {columns.map((col) => {
                const isSorted = sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 font-medium select-none tracking-wide uppercase text-[11px] text-forest-muted',
                      col.sortable && 'cursor-pointer hover:text-forest',
                      col.className
                    )}
                    onClick={() => col.sortable && onSortChange && onSortChange(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-forest-muted">
                          {isSorted ? (
                            sortOrder === 'desc' ? (
                              <ArrowDown className="w-3 h-3 text-forest-dark" />
                            ) : (
                              <ArrowUp className="w-3 h-3 text-forest-dark" />
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
          <tbody className="divide-y divide-forest-border/40">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, rIdx) => (
                <tr key={`skel-row-${rIdx}`} className="hover:bg-transparent">
                  {columns.map((col, cIdx) => (
                    <td key={`skel-col-${cIdx}`} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={(item as any).id ?? (item as any).product_id ?? idx}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={cn(
                    'transition-colors duration-150',
                    onRowClick && 'cursor-pointer hover:bg-forest-surface/70',
                    !onRowClick && 'hover:bg-forest-surface/40'
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

      {/* Pagination Footer */}
      {totalPages > 1 && onPageChange && (
        <div className="px-4 py-3 border-t border-forest-border/60 flex items-center justify-between text-xs text-forest-muted bg-forest-surface/20">
          <div>
            Showing{' '}
            <span className="font-medium text-forest tabular-nums">
              {(page - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium text-forest tabular-nums">
              {Math.min(page * pageSize, total)}
            </span>{' '}
            of <span className="font-medium text-forest tabular-nums">{total}</span> items
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isLoading}
              className="px-2 py-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="px-2 text-forest font-medium tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
              className="px-2 py-1"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label?: string;
  days: number;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  align?: 'left' | 'right';
}

type PresetKey =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year'
  | 'all_time';

interface PresetItem {
  key: PresetKey;
  label: string;
  getRange: () => { startDate: Date; endDate: Date; days: number };
}

// Format date helper: "Jan 10, 2025"
export function formatDisplayDate(d: Date): string {
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Reset time to 00:00:00 for accurate day comparison
function stripTime(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isSameDay(d1: Date | null, d2: Date | null): boolean {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isDateInRange(target: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const t = stripTime(target).getTime();
  const s = stripTime(start).getTime();
  const e = stripTime(end).getTime();
  return t >= Math.min(s, e) && t <= Math.max(s, e);
}

// Weekday headers: Mon through Sun
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className,
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Temporary selection inside the picker modal
  const [tempStart, setTempStart] = useState<Date>(value.startDate);
  const [tempEnd, setTempEnd] = useState<Date>(value.endDate);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(value.label || null);

  // CRITICAL: The two calendars are ALWAYS two sequential months: leftMonth = viewDate, rightMonth = viewDate + 1.
  // They can NEVER duplicate the same month!
  const [viewDate, setViewDate] = useState<Date>(() => {
    const end = new Date(value.endDate || new Date());
    // Position left month so the selected range is visible
    return new Date(end.getFullYear(), end.getMonth() - 1, 1);
  });

  // Sync internal state when external value changes
  useEffect(() => {
    setTempStart(value.startDate);
    setTempEnd(value.endDate);
    if (value.label) setActivePreset(value.label);

    const end = new Date(value.endDate || new Date());
    setViewDate(new Date(end.getFullYear(), end.getMonth() - 1, 1));
  }, [value.startDate, value.endDate, value.label]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTempStart(value.startDate);
        setTempEnd(value.endDate);
        setHoverDate(null);
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTempStart(value.startDate);
        setTempEnd(value.endDate);
        setHoverDate(null);
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, value]);

  // Presets definition matching Untitled UI (Image 2)
  const presets: PresetItem[] = useMemo(() => {
    const today = stripTime(new Date());

    return [
      {
        key: 'today',
        label: 'Today',
        getRange: () => ({
          startDate: today,
          endDate: today,
          days: 1,
        }),
      },
      {
        key: 'yesterday',
        label: 'Yesterday',
        getRange: () => {
          const y = new Date(today);
          y.setDate(today.getDate() - 1);
          return { startDate: y, endDate: y, days: 1 };
        },
      },
      {
        key: 'this_week',
        label: 'This week',
        getRange: () => {
          const d = new Date(today);
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const start = new Date(d.setDate(diff));
          return {
            startDate: stripTime(start),
            endDate: today,
            days: Math.max(1, Math.round((today.getTime() - start.getTime()) / 86400000) + 1),
          };
        },
      },
      {
        key: 'last_week',
        label: 'Last week',
        getRange: () => {
          const d = new Date(today);
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 7;
          const start = new Date(d.setDate(diff));
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          return {
            startDate: stripTime(start),
            endDate: stripTime(end),
            days: 7,
          };
        },
      },
      {
        key: 'this_month',
        label: 'This month',
        getRange: () => {
          const start = new Date(today.getFullYear(), today.getMonth(), 1);
          return {
            startDate: start,
            endDate: today,
            days: Math.max(1, Math.round((today.getTime() - start.getTime()) / 86400000) + 1),
          };
        },
      },
      {
        key: 'last_month',
        label: 'Last month',
        getRange: () => {
          const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const end = new Date(today.getFullYear(), today.getMonth(), 0);
          return {
            startDate: start,
            endDate: end,
            days: Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1),
          };
        },
      },
      {
        key: 'this_year',
        label: 'This year',
        getRange: () => {
          const start = new Date(today.getFullYear(), 0, 1);
          return {
            startDate: start,
            endDate: today,
            days: Math.min(365, Math.max(1, Math.round((today.getTime() - start.getTime()) / 86400000) + 1)),
          };
        },
      },
      {
        key: 'last_year',
        label: 'Last year',
        getRange: () => {
          const start = new Date(today.getFullYear() - 1, 0, 1);
          const end = new Date(today.getFullYear() - 1, 11, 31);
          return {
            startDate: start,
            endDate: end,
            days: 365,
          };
        },
      },
      {
        key: 'all_time',
        label: 'All time',
        getRange: () => {
          const start = new Date(today);
          start.setDate(today.getDate() - 365);
          return {
            startDate: start,
            endDate: today,
            days: 365,
          };
        },
      },
    ];
  }, []);

  const handleApplyPreset = (preset: PresetItem) => {
    const range = preset.getRange();
    setTempStart(range.startDate);
    setTempEnd(range.endDate);
    setActivePreset(preset.label);
    setHoverDate(null);

    // Position view so the range is shown across the two months
    const end = new Date(range.endDate);
    setViewDate(new Date(end.getFullYear(), end.getMonth() - 1, 1));
  };

  // Date selection click handler on calendar
  const handleDateClick = (date: Date) => {
    setActivePreset(null);

    if (!tempStart || (tempStart && tempEnd)) {
      // Pick first date
      setTempStart(date);
      setTempEnd(null as any);
      setHoverDate(null);
    } else if (tempStart && !tempEnd) {
      // Pick second date
      if (date < tempStart) {
        setTempEnd(tempStart);
        setTempStart(date);
      } else {
        setTempEnd(date);
      }
      setHoverDate(null);
    }
  };

  const handleApply = () => {
    if (!tempStart) return;
    const finalStart = tempStart;
    const finalEnd = tempEnd || tempStart;

    const diffDays = Math.max(
      1,
      Math.min(365, Math.round((finalEnd.getTime() - finalStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    );

    onChange({
      startDate: finalStart,
      endDate: finalEnd,
      label: activePreset || undefined,
      days: diffDays,
    });
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStart(value.startDate);
    setTempEnd(value.endDate);
    setHoverDate(null);
    setActivePreset(value.label || null);
    setIsOpen(false);
  };

  // Month navigation: shifts viewDate forward or backward by 1 month
  const prevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Left month is viewDate; right month is always viewDate + 1
  const leftMonthDate = useMemo(() => new Date(viewDate.getFullYear(), viewDate.getMonth(), 1), [viewDate]);
  const rightMonthDate = useMemo(() => new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1), [viewDate]);

  // Generate calendar days for a specific year and month
  const getCalendarDays = (year: number, month: number) => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 7 : startDayOfWeek;

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Preceding days from previous month
    for (let i = startDayOfWeek - 1; i > 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i + 1),
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Trailing days from next month to complete 6 rows (42 days)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const leftDays = useMemo(
    () => getCalendarDays(leftMonthDate.getFullYear(), leftMonthDate.getMonth()),
    [leftMonthDate]
  );
  const rightDays = useMemo(
    () => getCalendarDays(rightMonthDate.getFullYear(), rightMonthDate.getMonth()),
    [rightMonthDate]
  );

  const effectiveEnd = tempEnd || (hoverDate && tempStart ? hoverDate : tempStart);
  const normalizedStart =
    tempStart && effectiveEnd ? (tempStart <= effectiveEnd ? tempStart : effectiveEnd) : tempStart;
  const normalizedEnd =
    tempStart && effectiveEnd ? (tempStart <= effectiveEnd ? effectiveEnd : tempStart) : tempEnd;

  const today = stripTime(new Date());

  const renderMonthCalendar = (
    viewMonth: Date,
    days: Array<{ date: Date; isCurrentMonth: boolean }>,
    isLeft: boolean
  ) => {
    const monthTitle = viewMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    return (
      <div className="flex flex-col w-[280px]">
        {/* Month Header with discrete < and > outline buttons (Untitled UI design) */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            type="button"
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition-all shadow-xs"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
            {monthTitle}
          </span>

          <button
            type="button"
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition-all shadow-xs"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday headers: Mo, Tu, We, Th, Fr, Sa, Su */}
        <div className="grid grid-cols-7 mb-1 text-center">
          {WEEKDAYS.map((wd) => (
            <span key={wd} className="text-[12px] font-medium text-slate-400 dark:text-slate-500 py-1">
              {wd}
            </span>
          ))}
        </div>

        {/* Days Grid: 7 cols */}
        <div className="grid grid-cols-7 gap-y-1">
          {days.map(({ date, isCurrentMonth }, idx) => {
            // CRITICAL: Only in-month days participate in range highlighting and selection!
            // This prevents duplicate highlights across both calendar months.
            const isStart = isCurrentMonth && isSameDay(date, normalizedStart);
            const isEnd = isCurrentMonth && isSameDay(date, normalizedEnd);
            const inRange = isCurrentMonth && isDateInRange(date, normalizedStart, normalizedEnd);
            const isSingleSelected = isStart && isEnd;
            const isToday = isSameDay(date, today);

            // Connective range background bar
            const hasRangeBar = inRange && !isSingleSelected;

            return (
              <div
                key={idx}
                className={cn('h-9 relative flex items-center justify-center p-0 select-none')}
              >
                {/* Continuous background range highlight bar (Untitled UI style) */}
                {hasRangeBar && (
                  <div
                    className={cn(
                      'absolute inset-y-0 bg-blue-50 dark:bg-blue-950/40',
                      isStart && 'left-1/2 right-0 rounded-l-none',
                      isEnd && 'left-0 right-1/2 rounded-r-none',
                      !isStart && !isEnd && 'left-0 right-0'
                    )}
                  />
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (isCurrentMonth) {
                      handleDateClick(date);
                    } else {
                      // Clicking an out-of-month day navigates to that month
                      setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
                    }
                  }}
                  onMouseEnter={() => {
                    if (isCurrentMonth && tempStart && !tempEnd) {
                      setHoverDate(date);
                    }
                  }}
                  className={cn(
                    'w-9 h-9 rounded-full text-[13px] flex flex-col items-center justify-center transition-all relative z-10 font-normal',
                    // Selected start or end date: solid vibrant blue circle (Untitled UI)
                    (isStart || isEnd) &&
                      'bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700',
                    // Days inside selected range: dark blue text
                    inRange && !isStart && !isEnd && 'text-blue-900 dark:text-blue-200 font-medium',
                    // Normal in-month days
                    !inRange &&
                      isCurrentMonth &&
                      'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-normal',
                    // Out-of-month days: muted and faint
                    !isCurrentMonth &&
                      'text-slate-300 dark:text-slate-600 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  )}
                >
                  <span>{date.getDate()}</span>
                  {/* Subtle dot indicator for today's date if not selected */}
                  {isToday && !isStart && !isEnd && (
                    <span className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 absolute bottom-1" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('relative inline-block text-left', className)} ref={containerRef}>
      {/* TRIGGER BUTTON (Matching Image 2 Untitled UI) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border transition-all duration-150 select-none text-xs font-medium shadow-xs',
          isOpen
            ? 'bg-surface border-blue-500 ring-2 ring-blue-500/15 text-text'
            : 'bg-surface border-border hover:border-slate-300 dark:hover:border-slate-600 text-text hover:bg-surfaceAlt/50'
        )}
      >
        <CalendarIcon className="w-4 h-4 text-slate-400 dark:text-slate-400 shrink-0" />
        <span className="tabular-nums font-medium text-slate-700 dark:text-slate-200">
          {formatDisplayDate(value.startDate)} – {formatDisplayDate(value.endDate)}
        </span>
      </button>

      {/* DROPDOWN POPOVER MODAL (Dual calendar + presets sidebar + footer) */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-2.5 z-50 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 animate-fadeIn',
            align === 'right' ? 'right-0' : 'left-0',
            'max-w-[calc(100vw-2rem)]'
          )}
        >
          {/* Main Container: Presets Sidebar + Dual Calendars */}
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
            {/* 1. Presets Sidebar (Left) */}
            <div className="w-full md:w-44 p-3.5 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
              {presets.map((preset) => {
                const isSelected = activePreset === preset.label;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={cn(
                      'px-3.5 py-2 rounded-lg text-[13px] text-left transition-colors whitespace-nowrap font-medium',
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* 2. Dual Calendar Area (Right) */}
            <div className="p-5 flex flex-col sm:flex-row items-center sm:items-start justify-center gap-6 overflow-x-auto bg-white dark:bg-slate-900">
              {renderMonthCalendar(leftMonthDate, leftDays, true)}
              <div className="hidden sm:block w-px bg-slate-100 dark:bg-slate-800 h-80 self-stretch my-1" />
              {renderMonthCalendar(rightMonthDate, rightDays, false)}
            </div>
          </div>

          {/* 3. Bottom Footer Bar (Inputs + Cancel / Apply) */}
          <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-900/40">
            {/* Date Inputs Display matching Image 2 */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium min-w-[110px] text-center shadow-xs">
                {tempStart ? formatDisplayDate(tempStart) : 'Start date'}
              </div>
              <span className="text-slate-400 text-xs font-medium">—</span>
              <div className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium min-w-[110px] text-center shadow-xs">
                {tempEnd ? formatDisplayDate(tempEnd) : tempStart ? formatDisplayDate(tempStart) : 'End date'}
              </div>
            </div>

            {/* Actions: Cancel & Apply matching Image 2 */}
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CurrencyConfig {
  code: string;
  locale: string;
}

let activeCurrencyConfig: CurrencyConfig = {
  code: 'INR',
  locale: 'en-IN',
};

export function setGlobalCurrencyConfig(config: Partial<CurrencyConfig>) {
  if (config.code) activeCurrencyConfig.code = config.code;
  if (config.locale) activeCurrencyConfig.locale = config.locale;
}

export function getGlobalCurrencyConfig(): CurrencyConfig {
  return activeCurrencyConfig;
}

export function formatCurrency(value: number | string | undefined | null, overrideConfig?: Partial<CurrencyConfig>): string {
  const config = { ...activeCurrencyConfig, ...overrideConfig };
  if (value === undefined || value === null) {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);
  }

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatCompactCurrency(value: number | string | undefined | null, overrideConfig?: Partial<CurrencyConfig>): string {
  const config = { ...activeCurrencyConfig, ...overrideConfig };
  if (value === undefined || value === null) {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(0);
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(0);
  }

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

export function parseDateSafe(dateString: string | undefined | null): Date | null {
  if (!dateString) return null;
  let str = String(dateString).trim();
  if (!str) return null;

  // Replace space with 'T' if format is "YYYY-MM-DD HH:mm:ss"
  if (str.includes(' ') && !str.includes('T')) {
    str = str.replace(' ', 'T');
  }

  // If no timezone offset is specified (no 'Z' and no +/-HH:mm or +/-HHmm),
  // assume UTC ('Z') because the database and backend generate all timestamps in UTC.
  // Without 'Z', JavaScript interprets ISO strings as local time, causing timezone shifts (e.g. -5h30m in IST).
  if (!str.endsWith('Z') && !/[+-]\d{2}(:?\d{2})?$/.test(str)) {
    str = `${str}Z`;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const d = parseDateSafe(dateString);
    if (!d) return String(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return String(dateString);
  }
}

export function formatDateShort(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const d = parseDateSafe(dateString);
    if (!d) return String(dateString);
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return String(dateString);
  }
}

export function getErrorMessage(error: any): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (detail?.message) return detail.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

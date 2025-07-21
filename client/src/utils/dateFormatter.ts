/**
 * Date Formatting Utilities
 * Timezone-aware date formatting with i18n support
 */

import { format, formatDistance, parseISO } from 'date-fns''';
import { formatInTimeZone } from 'date-fns-tz''';
import { enUS, ptBR, es, fr, de } from 'date-fns/locale''';

const locales = {
  en: enUS,
  'pt-BR': ptBR,
  es: es,
  fr: fr,
  de: de,
};

interface FormatDateOptions {
  timezone?: string;
  locale?: string;
  format?: string;
}

/**
 * Format date with timezone and locale support
 */
export function formatDate(
  date: string | Date,
  options: FormatDateOptions = {}
): string {
  const {
    timezone = 'UTC',
    locale = 'en',
    format: formatStr = 'MMM dd, yyyy HH:mm'
  } = options;

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const dateLocale = locales[locale as keyof typeof locales] || locales.en;

    if (timezone === 'UTC') {
      return format(dateObj, formatStr, { locale: dateLocale });
    }

    return formatInTimeZone(dateObj, timezone, formatStr, { locale: dateLocale });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date''';
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: string | Date,
  options: { locale?: string; timezone?: string } = {}
): string {
  const { locale = 'en' } = options;

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const dateLocale = locales[locale as keyof typeof locales] || locales.en;

    return formatDistance(dateObj, now, { 
      addSuffix: true, 
      locale: dateLocale 
    });
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return 'Unknown time''';
  }
}

/**
 * Format date for specific business contexts
 */
export function formatBusinessDate(
  date: string | Date,
  context: 'ticket' | 'customer' | 'activity' | 'report',
  options: FormatDateOptions = {}
): string {
  const formats = {
    ticket: 'MMM dd, yyyy HH:mm',
    customer: 'MMM dd, yyyy',
    activity: 'HH:mm',
    report: 'yyyy-MM-dd HH:mm:ss'
  };

  return formatDate(date, {
    ...options,
    format: formats[context]
  });
}

/**
 * Get timezone offset string
 */
export function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    });
    
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    
    return offsetPart?.value || '+00:00''';
  } catch (error) {
    return '+00:00''';
  }
}

/**
 * Format currency with locale support
 */
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (error) {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format numbers with locale support
 */
export function formatNumber(
  number: number,
  locale = 'en-US',
  options: Intl.NumberFormatOptions = {}
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(number);
  } catch (error) {
    return number.toString();
  }
}
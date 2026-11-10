export const ANALYTICS_RANGES = { '7d': 7, '30d': 30, '90d': 90 } as const;
export type AnalyticsRange = keyof typeof ANALYTICS_RANGES;

const DAY_MS = 24 * 60 * 60 * 1000;
const FALLBACK_TIMEZONE = 'UTC';

export interface AnalyticsWindow {
  range: AnalyticsRange;
  days: number;
  start: Date;
  previousStart: Date;
  startDate: string;
  previousStartDate: string;
  dates: string[];
  timezone: string;
}

export function analyticsRange(value: unknown): AnalyticsRange {
  return typeof value === 'string' && value in ANALYTICS_RANGES ? (value as AnalyticsRange) : '30d';
}

export function analyticsTimezone(value: unknown): string {
  if (typeof value !== 'string' || !value || value.length > 64) return FALLBACK_TIMEZONE;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return value;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function analyticsWindow(range: AnalyticsRange, timezone: string): AnalyticsWindow {
  const days = ANALYTICS_RANGES[range];
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const previousStart = new Date(start.getTime() - days * DAY_MS);
  const dates = Array.from({ length: days }, (_, i) => isoDay(new Date(start.getTime() + i * DAY_MS)));
  return {
    range,
    days,
    start,
    previousStart,
    startDate: isoDay(start),
    previousStartDate: isoDay(previousStart),
    dates,
    timezone,
  };
}

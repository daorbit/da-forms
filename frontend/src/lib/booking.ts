import type { BookingConfig, BookingTimeFormat, FormField, TimeRange } from '@/types';
import { flattenFields } from '@/lib/fieldTree';

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120];

const WORKDAY: TimeRange[] = [{ start: '09:00', end: '17:00' }];

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function timeZoneOptions(): string[] {
  const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  const zones = supported ? supported('timeZone') : [];
  return zones.length ? zones : [browserTimeZone(), 'UTC'];
}

export function defaultBookingConfig(): BookingConfig {
  return {
    duration: 30,
    minNotice: 240,
    maxDaysAhead: 30,
    timezone: browserTimeZone(),
    weekly: [[], WORKDAY, WORKDAY, WORKDAY, WORKDAY, WORKDAY, []],
    seats: 1,
    addMeet: true,
    timeFormat: '12h',
  };
}

export function withBookingDefaults(config?: BookingConfig): BookingConfig {
  return { ...defaultBookingConfig(), ...config };
}

export function findBookingField(fields: FormField[]): FormField | undefined {
  return flattenFields(fields).find((f) => f.type === 'booking');
}

export function formatSlotTime(iso: string | Date, timeZone: string, timeFormat: BookingTimeFormat = '12h'): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: timeFormat !== '24h',
  }).format(new Date(iso));
}

export function formatSlotDay(iso: string | Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatBookingRange(
  start: string,
  end: string,
  timeZone: string,
  timeFormat: BookingTimeFormat = '12h'
): string {
  return `${formatSlotDay(start, timeZone)}, ${formatSlotTime(start, timeZone, timeFormat)} – ${formatSlotTime(end, timeZone, timeFormat)}`;
}

export function bookingEnd(field: FormField, startIso: string): string {
  return new Date(new Date(startIso).getTime() + (field.booking?.duration ?? 30) * 60_000).toISOString();
}

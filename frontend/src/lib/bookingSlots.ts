import type { BookingConfig, TimeRange } from '@/types';
import { addDays, dateKeyIn, weekdayOf, zonedToUtc } from './zonedTime';

export interface Slot {
  start: Date;
  end: Date;
}

export interface Interval {
  start: Date;
  end: Date;
}

export const MAX_RANGE_DAYS = 42;

const MINUTE = 60_000;

export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function validRanges(ranges: TimeRange[] | undefined): TimeRange[] {
  return (ranges ?? []).filter((r) => minutesOf(r.end) > minutesOf(r.start));
}

export function slotsForDay(config: BookingConfig, dateKey: string): Slot[] {
  if (config.blockedDates?.includes(dateKey)) return [];
  const duration = Math.max(5, config.duration || 30);
  const step = Math.max(5, config.interval || duration);
  const slots: Slot[] = [];

  for (const range of validRanges(config.weekly?.[weekdayOf(dateKey)])) {
    const end = minutesOf(range.end);
    for (let t = minutesOf(range.start); t + duration <= end; t += step) {
      const start = zonedToUtc(dateKey, t, config.timezone);
      slots.push({ start, end: new Date(start.getTime() + duration * MINUTE) });
    }
  }
  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function bookingWindow(config: BookingConfig, now: Date): { earliest: Date; latest: Date } {
  const earliest = new Date(now.getTime() + Math.max(0, config.minNotice ?? 0) * MINUTE);
  const lastDay = addDays(dateKeyIn(now, config.timezone), Math.max(1, config.maxDaysAhead ?? 30));
  return { earliest, latest: zonedToUtc(addDays(lastDay, 1), 0, config.timezone) };
}

export function candidateSlots(config: BookingConfig, fromKey: string, toKey: string, now: Date): Slot[] {
  const { earliest, latest } = bookingWindow(config, now);
  const slots: Slot[] = [];
  for (let day = fromKey, i = 0; day <= toKey && i < MAX_RANGE_DAYS; day = addDays(day, 1), i++) {
    for (const slot of slotsForDay(config, day)) {
      if (slot.start >= earliest && slot.end <= latest) slots.push(slot);
    }
  }
  return slots;
}

export function overlapsAny(slot: Slot, busy: Interval[], config: BookingConfig): boolean {
  const start = slot.start.getTime() - Math.max(0, config.bufferBefore ?? 0) * MINUTE;
  const end = slot.end.getTime() + Math.max(0, config.bufferAfter ?? 0) * MINUTE;
  return busy.some((b) => b.start.getTime() < end && b.end.getTime() > start);
}

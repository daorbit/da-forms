export type CalendarScope = 'month' | 'week';

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const HOUR_PX = 56;

export interface CalendarDay {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isWeekend: boolean;
}

export function dayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildDays(start: Date, count: number, month: number): CalendarDay[] {
  const todayKey = dayKey(new Date());
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = dayKey(date);
    return {
      date,
      key,
      inMonth: date.getMonth() === month,
      isToday: key === todayKey,
      isPast: key < todayKey,
      isWeekend: date.getDay() % 6 === 0,
    };
  });
}

export function weekDays(cursor: Date): CalendarDay[] {
  return buildDays(startOfWeek(cursor), 7, cursor.getMonth());
}

export function monthDays(cursor: Date): CalendarDay[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  return buildDays(startOfWeek(first), 42, cursor.getMonth());
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function hourLabel(hour: number): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric' });
}

export function timeLabel(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function rangeLabel(start: Date, end: Date): string {
  const sameHalf = start.getHours() < 12 === end.getHours() < 12;
  if (!sameHalf) return `${timeLabel(start)} – ${timeLabel(end)}`;
  const bare = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/, '');
  return `${bare} – ${timeLabel(end)}`;
}

export function periodLabel(scope: CalendarScope, cursor: Date, days: CalendarDay[]): string {
  if (scope === 'month') return cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const start = days[0]?.date;
  const end = days[days.length - 1]?.date;
  if (!start || !end) return '';
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
}

export function stepCursor(cursor: Date, scope: CalendarScope, direction: number): Date {
  const next = new Date(cursor);
  if (scope === 'week') next.setDate(cursor.getDate() + direction * 7);
  else next.setMonth(cursor.getMonth() + direction, 1);
  return next;
}

export function isCurrentPeriod(cursor: Date, scope: CalendarScope): boolean {
  const now = new Date();
  if (scope === 'week') return startOfWeek(cursor).getTime() === startOfWeek(now).getTime();
  return cursor.getMonth() === now.getMonth() && cursor.getFullYear() === now.getFullYear();
}

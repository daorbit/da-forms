import type { Analytics } from '@/lib/api';

export type Daily = NonNullable<Analytics['daily']>[number];

export function weekChange(daily: Daily[], pick: (d: Daily) => number): number | null {
  if (daily.length < 14) return null;
  const sum = (xs: Daily[]) => xs.reduce((n, x) => n + pick(x), 0);
  const before = sum(daily.slice(0, 7));
  if (before === 0) return null;
  return Math.round(((sum(daily.slice(7)) - before) / before) * 100);
}

export function rateChange(daily: Daily[]): number | null {
  if (daily.length < 14) return null;
  const rate = (xs: Daily[]) => {
    const views = xs.reduce((n, x) => n + x.views, 0);
    return views ? xs.reduce((n, x) => n + x.responses, 0) / views : 0;
  };
  const before = rate(daily.slice(0, 7));
  if (before === 0) return null;
  return Math.round(((rate(daily.slice(7)) - before) / before) * 100);
}

export function percent(part: number, total: number): number {
  return total ? Math.round((part / total) * 100) : 0;
}

export function shortDay(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

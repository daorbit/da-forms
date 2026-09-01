export type StatusFilter = 'all' | 'unread' | 'read';
export type DayFilter = 'all' | 'today' | '7' | '30';

export const STATUS_LABEL: Record<StatusFilter, string> = {
  all: 'All Entries',
  unread: 'Unread',
  read: 'Read',
};

export const DAY_LABEL: Record<DayFilter, string> = {
  all: 'All Days',
  today: 'Today',
  '7': 'Last 7 Days',
  '30': 'Last 30 Days',
};

export function dayFilterToRange(day: DayFilter): { from?: string } {
  if (day === 'all') return {};
  const now = new Date();
  const days = day === 'today' ? 0 : Number(day) - 1;
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString() };
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isImageUrl(url: string) {
  return /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i.test(url);
}

export const PAGE_SIZE = 10;

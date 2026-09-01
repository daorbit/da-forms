export type StatusFilter = 'all' | 'unread' | 'read';
export type DayFilter = 'all' | 'today' | '7' | '30' | 'custom';
/** A picked [start, end] pair, or either half still unset while the range
 *  picker is mid-selection. Only meaningful when `day === 'custom'`. */
export type CustomRange = [Date | null, Date | null];

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
  custom: 'Custom range',
};

export function dayFilterToRange(day: DayFilter, customRange?: CustomRange): { from?: string; to?: string } {
  if (day === 'custom') {
    const [start, end] = customRange ?? [null, null];
    if (!start) return {};
    const from = new Date(start);
    from.setHours(0, 0, 0, 0);
    // No end picked yet reads as "from that day onward" rather than no
    // filter at all — the same half-open behaviour the presets already have.
    if (!end) return { from: from.toISOString() };
    const to = new Date(end);
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }
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

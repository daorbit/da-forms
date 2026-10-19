const DAY_MS = 24 * 60 * 60 * 1000;
export const MAX_WINDOW_DAYS = 366;
const DEFAULT_WINDOW_DAYS = 30;

export interface SummaryWindow {
  since: Date;
  until: Date;
}

function parseDate(raw: unknown): Date | null {
  if (typeof raw !== 'string' || !raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function readWindow(query: Record<string, unknown>, now = Date.now()): SummaryWindow | null {
  if (query.to !== undefined && !parseDate(query.to)) return null;
  if (query.from !== undefined && !parseDate(query.from)) return null;
  const until = parseDate(query.to) ?? new Date(now);
  const since = parseDate(query.from) ?? new Date(until.getTime() - DEFAULT_WINDOW_DAYS * DAY_MS);
  if (since > until) return null;
  if (until.getTime() - since.getTime() > MAX_WINDOW_DAYS * DAY_MS) return null;
  return { since, until };
}

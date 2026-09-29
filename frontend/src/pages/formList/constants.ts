export type SortOption = 'date' | 'dateAsc' | 'name' | 'nameDesc' | 'status';

export type StatusFilter = 'all' | 'published' | 'draft';

export const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Live' },
  { value: 'draft', label: 'Drafts' },
];

export const SORT_LABEL: Record<SortOption, string> = {
  date: 'Newest first',
  dateAsc: 'Oldest first',
  name: 'Name (A-Z)',
  nameDesc: 'Name (Z-A)',
  status: 'Status',
};

export const PAGE_SIZE = 10;

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function conversionRate(views?: number, responses?: number): string {
  if (!views || responses === undefined) return '—';
  return `${Math.round((responses / views) * 100)}%`;
}

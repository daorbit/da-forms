import { getBookingSummary, type BookingRange, type BookingSummary } from '@/lib/api';
import { useRangedFetch } from './useRangedFetch';

export function useBookingSummary(workspaceId: string) {
  return useRangedFetch<BookingRange, BookingSummary>(
    (range) => getBookingSummary(range, workspaceId),
    '30d',
    'Could not load bookings',
    [workspaceId],
  );
}

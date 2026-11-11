import type { BookingEvent } from '@/components/builder/entries/calendar/bookingEvents';
import type { BookingStatusFilter } from './filterBookings';

export type BookingCounts = Record<BookingStatusFilter, number>;

export function bookingCounts(events: BookingEvent[]): BookingCounts {
  const counts: BookingCounts = { all: events.length, upcoming: 0, live: 0, past: 0 };
  for (const event of events) counts[event.state] += 1;
  return counts;
}

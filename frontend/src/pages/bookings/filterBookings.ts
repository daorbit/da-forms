import type { CalendarBooking } from '@/lib/api';
import type { BookingEvent, BookingEventState } from '@/components/builder/entries/calendar/bookingEvents';

export type BookingStatusFilter = 'all' | BookingEventState;

export function filterBookings(bookings: CalendarBooking[], query: string, formId: string | null): CalendarBooking[] {
  const q = query.trim().toLowerCase();
  return bookings.filter((b) => {
    if (formId && b.formId !== formId) return false;
    if (!q) return true;
    return [b.name, b.email, b.formName].some((text) => text?.toLowerCase().includes(q));
  });
}

export function filterByStatus(events: BookingEvent[], status: BookingStatusFilter): BookingEvent[] {
  return status === 'all' ? events : events.filter((e) => e.state === status);
}

export function countByForm(bookings: CalendarBooking[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const b of bookings) counts.set(b.formId, (counts.get(b.formId) ?? 0) + 1);
  return counts;
}

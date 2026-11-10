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

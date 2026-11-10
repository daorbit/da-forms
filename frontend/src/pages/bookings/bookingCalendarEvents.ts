import type { CalendarBooking } from '@/lib/api';
import { initialsOf } from '@/lib/respondent';
import { stateOf, type BookingEvent } from '@/components/builder/entries/calendar/bookingEvents';

export const FORM_TONES = 6;

export function formTone(formIds: string[], formId: string): number {
  const index = formIds.indexOf(formId);
  return (index < 0 ? 0 : index) % FORM_TONES;
}

export function bookingCalendarEvents(bookings: CalendarBooking[], formIds: string[]): BookingEvent[] {
  const now = Date.now();
  return bookings.map((b) => {
    const start = new Date(b.start);
    const end = new Date(b.end);
    return {
      id: b.id,
      start,
      end,
      title: b.name ?? b.email ?? 'Booking',
      email: b.name ? b.email : undefined,
      initials: initialsOf(b.name ?? b.email),
      meetLink: b.meetLink,
      eventLink: b.eventLink,
      state: stateOf(start, end, now),
      formId: b.formId,
      formName: b.formName || 'Untitled form',
      tone: formTone(formIds, b.formId),
    };
  });
}

import type { BookingEvent } from './bookingEvents';
import { timeLabel } from './calendarDates';

export function bookingDetailsText(event: BookingEvent): string {
  const date = event.start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const minutes = Math.round((event.end.getTime() - event.start.getTime()) / 60_000);
  return [
    event.title,
    event.email,
    `${date}, ${timeLabel(event.start)} – ${timeLabel(event.end)} (${minutes} min)`,
    event.formName,
    event.meetLink ? `Google Meet: ${event.meetLink}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
}

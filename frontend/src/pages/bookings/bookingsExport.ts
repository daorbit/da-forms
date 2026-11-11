import type { BookingEvent } from '@/components/builder/entries/calendar/bookingEvents';
import { downloadCsv } from '@/lib/csv';

const STATE_LABEL = { upcoming: 'Upcoming', live: 'In progress', past: 'Completed' } as const;

export function exportBookingsCsv(events: BookingEvent[]) {
  const rows = events.map((e) => [
    e.title,
    e.email ?? '',
    e.formName ?? '',
    e.start.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    e.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    Math.round((e.end.getTime() - e.start.getTime()) / 60_000),
    STATE_LABEL[e.state],
    e.meetLink ?? '',
  ]);
  downloadCsv(`bookings-${new Date().toISOString().slice(0, 10)}`, [
    ['Name', 'Email', 'Form', 'Date', 'Time', 'Minutes', 'Status', 'Google Meet link'],
    ...rows,
  ]);
}

import { CalendarCheckIcon, CalendarClockIcon, CrownIcon, FileTextIcon } from 'lucide-react';
import type { BookingRange, BookingSummary } from '@/lib/api';
import { StatTile } from '@/pages/formAnalytics/StatTile';
import tiles from '@/pages/formAnalytics/StatTile.module.css';
import { bookingDay } from './bookingFormat';

const PERIOD: Record<BookingRange, string> = {
  '30d': 'In the last 30 days',
  '90d': 'In the last 90 days',
  '365d': 'In the last 12 months',
};

const UPCOMING_LIMIT = 10;

export function BookingsTiles({ data, range }: { data: BookingSummary; range: BookingRange }) {
  const busiest = data.byForm[0];
  const next = data.upcoming[0];
  const upcoming = data.upcoming.length >= UPCOMING_LIMIT ? `${UPCOMING_LIMIT}+` : String(data.upcoming.length);

  return (
    <div className={tiles.grid}>
      <StatTile icon={CalendarCheckIcon} tone="blue" label="Meetings booked" value={data.total.toLocaleString()} subline={PERIOD[range]} />
      <StatTile icon={CalendarClockIcon} tone="purple" label="Coming up" value={upcoming} subline={next ? `Next on ${bookingDay(next.start)}` : 'Nothing booked yet'} />
      <StatTile
        icon={CrownIcon}
        tone="orange"
        label="Busiest form"
        value={busiest ? busiest.name || 'Untitled form' : '—'}
        subline={busiest ? `${busiest.bookings.toLocaleString()} bookings` : 'Add a booking field to a form'}
      />
      <StatTile icon={FileTextIcon} tone="green" label="Forms taking bookings" value={data.byForm.length.toLocaleString()} subline={PERIOD[range]} />
    </div>
  );
}

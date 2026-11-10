import { CalendarClockIcon } from 'lucide-react';
import type { BookingSummary } from '@/lib/api';
import { RankEmpty } from '@/components/rank/RankCard';
import { AnalyticsCard } from '@/pages/formAnalytics/AnalyticsCard';
import { bookingDay, bookingTime, untilLabel } from './bookingFormat';
import classes from './BookingsPage.module.css';

export function UpcomingBookingsCard({ upcoming }: { upcoming: BookingSummary['upcoming'] }) {
  return (
    <AnalyticsCard title="Upcoming meetings" subtitle="The next confirmed bookings, soonest first" tone="violet">
      {upcoming.length === 0 ? (
        <RankEmpty icon={CalendarClockIcon}>No meetings booked yet. New bookings show up here.</RankEmpty>
      ) : (
        <ul className={classes.list}>
          {upcoming.map((b) => (
            <li key={`${b.formId}-${b.start}`} className={classes.row}>
              <span className={classes.date}>
                <span className={classes.day}>{bookingDay(b.start)}</span>
                <span className={classes.time}>{bookingTime(b.start, b.end)}</span>
              </span>
              <span className={classes.form}>{b.formName || 'Untitled form'}</span>
              <span className={classes.until}>{untilLabel(b.start)}</span>
            </li>
          ))}
        </ul>
      )}
    </AnalyticsCard>
  );
}

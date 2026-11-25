import { PageHeader } from '@/components/ui/PageHeader';
import { Brick, Bricks } from '@/components/ui/skeleton/Bricks';
import { UpcomingSkeleton } from '@/components/builder/entries/calendar/CalendarSkeleton';
import { brickRows } from '@/lib/brickRows';
import calendar from '@/components/builder/entries/calendar/EntriesCalendar.module.css';
import analytics from '@/pages/formAnalytics/FormAnalytics.module.css';
import classes from './BookingsPage.module.css';

const TOOLBAR = brickRows(1, 40);

export function BookingsPageSkeleton() {
  return (
    <div className={analytics.page}>
      <PageHeader title="Bookings" description="Every meeting booked through your forms, on one calendar." />
      <div className={classes.toolbar}>
        <Bricks rows={TOOLBAR} label="Loading bookings" />
      </div>
      <div className={calendar.root}>
        <Brick height={660} />
        <UpcomingSkeleton />
      </div>
    </div>
  );
}

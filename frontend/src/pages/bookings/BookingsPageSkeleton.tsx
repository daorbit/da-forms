import { Skeleton } from '@mantine/core';
import { CalendarMonthSkeleton, UpcomingSkeleton } from '@/components/builder/entries/calendar/CalendarSkeleton';
import { monthDays } from '@/components/builder/entries/calendar/calendarDates';
import calendar from '@/components/builder/entries/calendar/EntriesCalendar.module.css';
import analytics from '@/pages/formAnalytics/FormAnalytics.module.css';
import classes from './BookingsPage.module.css';

export function BookingsPageSkeleton() {
  return (
    <div className={analytics.page} aria-busy="true" aria-label="Loading bookings">
      <div className={analytics.skeleton} data-size="header" />
      <div className={classes.toolbar}>
        <Skeleton height={36} width={380} radius={10} />
        <div className={classes.filters}>
          <Skeleton height={36} width={260} radius={10} />
          <Skeleton height={36} width={240} radius={10} />
        </div>
      </div>
      <div className={calendar.root}>
        <div className={calendar.main}>
          <div className={calendar.toolbar}>
            <div className={calendar.nav}>
              <Skeleton height={28} width={60} radius={10} />
              <Skeleton height={22} width={170} radius="sm" />
            </div>
            <Skeleton height={30} width={120} radius={10} />
          </div>
          <CalendarMonthSkeleton days={monthDays(new Date())} />
        </div>
        <UpcomingSkeleton />
      </div>
    </div>
  );
}

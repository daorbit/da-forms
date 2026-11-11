import { Skeleton } from '@mantine/core';
import { DAY_NAMES, type CalendarDay } from './calendarDates';
import classes from './EntriesCalendar.module.css';
import upcoming from './UpcomingBookings.module.css';

const CHIP_PATTERN = [0, 1, 0, 0, 2, 0, 1, 0, 0, 1, 0, 0, 0, 1];

export function CalendarMonthSkeleton({ days }: { days: CalendarDay[] }) {
  return (
    <div className={classes.month} aria-busy="true">
      {DAY_NAMES.map((name) => (
        <div key={name} className={classes.monthHead}>
          {name}
        </div>
      ))}
      {days.map((day, i) => (
        <div
          key={day.key}
          className={classes.monthDay}
          data-outside={!day.inMonth || undefined}
          data-weekend={day.isWeekend || undefined}
        >
          <Skeleton height={14} width={18} radius="sm" />
          <div className={classes.monthStack}>
            {Array.from({ length: CHIP_PATTERN[i % CHIP_PATTERN.length] }).map((_, n) => (
              <Skeleton key={n} height={26} radius={7} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function UpcomingSkeleton() {
  return (
    <aside className={upcoming.root} aria-busy="true">
      <div className={upcoming.head}>
        <Skeleton height={14} width={80} radius="sm" />
        <Skeleton height={10} width={60} radius="sm" />
      </div>
      <div className={classes.skeletonNext}>
        <Skeleton height={10} width={90} radius="sm" />
        <div className={classes.skeletonRow}>
          <Skeleton height={52} width={48} radius={10} />
          <div className={classes.skeletonLines}>
            <Skeleton height={13} width="80%" radius="sm" />
            <Skeleton height={11} width="60%" radius="sm" />
          </div>
        </div>
        <Skeleton height={30} radius="md" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={classes.skeletonItem}>
          <Skeleton height={11} width={70} radius="sm" />
          <div className={classes.skeletonRow}>
            <Skeleton height={28} width={56} radius="sm" />
            <div className={classes.skeletonLines}>
              <Skeleton height={12} width="75%" radius="sm" />
              <Skeleton height={10} width="50%" radius="sm" />
            </div>
          </div>
        </div>
      ))}
    </aside>
  );
}

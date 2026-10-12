import { useMemo, useState } from 'react';
import { ActionIcon, Button } from '@mantine/core';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { FormField, Submission } from '@/types';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { bookingEvents, groupByDay } from './bookingEvents';
import {
  isCurrentPeriod,
  monthDays,
  periodLabel,
  stepCursor,
  weekDays,
  type CalendarScope,
} from './calendarDates';
import { CalendarMonthGrid } from './CalendarMonthGrid';
import { CalendarWeekGrid } from './CalendarWeekGrid';
import { UpcomingBookings } from './UpcomingBookings';
import classes from './EntriesCalendar.module.css';

const SCOPE_TABS: { value: CalendarScope; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
];

interface Props {
  fields: FormField[];
  submissions: Submission[];
  loading: boolean;
  onOpen: (submission: Submission) => void;
}

export function EntriesCalendar({ fields, submissions, loading, onOpen }: Props) {
  const [cursor, setCursor] = useState(() => new Date());
  const [scope, setScope] = useState<CalendarScope>('month');

  const events = useMemo(() => bookingEvents(fields, submissions), [fields, submissions]);
  const byDay = useMemo(() => groupByDay(events), [events]);
  const days = useMemo(() => (scope === 'week' ? weekDays(cursor) : monthDays(cursor)), [scope, cursor]);

  const inView = days.reduce((sum, day) => sum + (day.inMonth || scope === 'week' ? byDay.get(day.key)?.length ?? 0 : 0), 0);

  const showWeek = (date: Date) => {
    setCursor(date);
    setScope('week');
  };

  return (
    <div className={classes.root} data-loading={loading || undefined}>
      <div className={classes.main}>
        <div className={classes.toolbar}>
          <div className={classes.nav}>
            <Button
              variant="default"
              size="xs"
              radius="xl"
              onClick={() => setCursor(new Date())}
              disabled={isCurrentPeriod(cursor, scope)}
            >
              Today
            </Button>
            <div className={classes.arrows}>
              <ActionIcon
                variant="subtle"
                color="gray"
                radius="xl"
                onClick={() => setCursor((c) => stepCursor(c, scope, -1))}
                aria-label="Previous"
              >
                <ChevronLeftIcon size={17} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="gray"
                radius="xl"
                onClick={() => setCursor((c) => stepCursor(c, scope, 1))}
                aria-label="Next"
              >
                <ChevronRightIcon size={17} />
              </ActionIcon>
            </div>
            <h2 className={classes.period}>{periodLabel(scope, cursor, days)}</h2>
            <span className={classes.periodCount}>
              {inView} {inView === 1 ? 'booking' : 'bookings'}
            </span>
          </div>
          <SegmentedTabs ariaLabel="Calendar range" size="sm" value={scope} onChange={setScope} data={SCOPE_TABS} />
        </div>

        {scope === 'week' ? (
          <CalendarWeekGrid days={days} byDay={byDay} onOpen={onOpen} />
        ) : (
          <CalendarMonthGrid days={days} byDay={byDay} onOpen={onOpen} onShowWeek={showWeek} />
        )}
      </div>

      <UpcomingBookings events={events} onOpen={onOpen} />
    </div>
  );
}

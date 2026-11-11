import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActionIcon, Button, Tooltip } from '@mantine/core';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { BookingEvent } from './bookingEvents';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { groupByDay } from './bookingEvents';
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
import { CalendarMonthSkeleton, UpcomingSkeleton } from './CalendarSkeleton';
import { useCalendarShortcuts } from './useCalendarShortcuts';
import classes from './EntriesCalendar.module.css';

const SCOPE_TABS: { value: CalendarScope; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
];

interface Props {
  events: BookingEvent[];
  loading: boolean;
  skeleton?: boolean;
  legend?: ReactNode;
  emptyHint?: string;
  onOpen: (event: BookingEvent) => void;
  onPeriod?: (from: Date, to: Date) => void;
}

function ShortcutHint() {
  return (
    <span className={classes.shortcutHint}>
      <kbd>T</kbd> today · <kbd>←</kbd>
      <kbd>→</kbd> move · <kbd>M</kbd>
      <kbd>W</kbd> view
    </span>
  );
}

export function BookingsCalendarView({ events, loading, skeleton, legend, emptyHint, onOpen, onPeriod }: Props) {
  const [cursor, setCursor] = useState(() => new Date());
  const [scope, setScope] = useState<CalendarScope>('month');

  const byDay = useMemo(() => groupByDay(events), [events]);
  const days = useMemo(() => (scope === 'week' ? weekDays(cursor) : monthDays(cursor)), [scope, cursor]);

  const firstKey = days[0]?.key;
  const lastKey = days[days.length - 1]?.key;
  useEffect(() => {
    if (!onPeriod || !days.length) return;
    const from = new Date(days[0].date);
    const to = new Date(days[days.length - 1].date);
    to.setDate(to.getDate() + 1);
    onPeriod(from, to);
  }, [firstKey, lastKey]);

  useCalendarShortcuts({
    onToday: () => setCursor(new Date()),
    onStep: (direction) => setCursor((c) => stepCursor(c, scope, direction)),
    onScope: setScope,
  });

  const inView = days.reduce((sum, day) => sum + (day.inMonth || scope === 'week' ? byDay.get(day.key)?.length ?? 0 : 0), 0);
  const label = periodLabel(scope, cursor, days);
  const showEmpty = !skeleton && !loading && inView === 0;

  const showWeek = (date: Date) => {
    setCursor(date);
    setScope('week');
  };

  return (
    <div className={classes.root} data-loading={loading || undefined}>
      <div className={classes.main}>
        <div className={classes.toolbar}>
          <div className={classes.nav}>
            <Tooltip label="Today (T)" withArrow>
              <Button
                variant="default"
                size="xs"
                radius="md"
                onClick={() => setCursor(new Date())}
                disabled={isCurrentPeriod(cursor, scope)}
              >
                Today
              </Button>
            </Tooltip>
            <div className={classes.arrows}>
              <ActionIcon
                variant="subtle"
                color="gray"
                radius="md"
                onClick={() => setCursor((c) => stepCursor(c, scope, -1))}
                aria-label="Previous"
              >
                <ChevronLeftIcon size={17} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="gray"
                radius="md"
                onClick={() => setCursor((c) => stepCursor(c, scope, 1))}
                aria-label="Next"
              >
                <ChevronRightIcon size={17} />
              </ActionIcon>
            </div>
            <h2 className={classes.period}>{label}</h2>
            {!skeleton && (
              <span className={classes.periodCount}>
                {inView} {inView === 1 ? 'booking' : 'bookings'}
              </span>
            )}
          </div>
          <div className={classes.nav}>
            <ShortcutHint />
            <SegmentedTabs ariaLabel="Calendar range" size="sm" value={scope} onChange={setScope} data={SCOPE_TABS} />
          </div>
        </div>

        {!skeleton && legend}

        <div className={classes.gridWrap}>
          {skeleton ? (
            <CalendarMonthSkeleton days={scope === 'week' ? monthDays(cursor) : days} />
          ) : scope === 'week' ? (
            <CalendarWeekGrid days={days} byDay={byDay} onOpen={onOpen} />
          ) : (
            <CalendarMonthGrid days={days} byDay={byDay} onOpen={onOpen} onShowWeek={showWeek} />
          )}
          {showEmpty && (
            <div className={classes.emptyNote}>
              <span className={classes.emptyTitle}>No bookings {scope === 'week' ? 'this week' : `in ${label}`}</span>
              {emptyHint && <span className={classes.emptyText}>{emptyHint}</span>}
            </div>
          )}
        </div>
      </div>

      {skeleton ? <UpcomingSkeleton /> : <UpcomingBookings events={events} onOpen={onOpen} />}
    </div>
  );
}

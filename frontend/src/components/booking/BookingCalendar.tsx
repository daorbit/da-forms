import { UnstyledButton } from '@mantine/core';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { addDays, weekdayOf } from '@/lib/zonedTime';
import classes from './BookingInput.module.css';

interface Props {
  month: string;
  selected: string | null;
  available: Set<string>;
  todayKey: string;
  minMonth: string;
  maxMonth: string;
  onSelect: (day: string) => void;
  onMonthChange: (month: string) => void;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

function monthTitle(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(y, m - 1, 1))
  );
}

function monthCells(month: string): (string | null)[] {
  const lead = (weekdayOf(month) + 6) % 7;
  const end = shiftMonth(month, 1);
  const days: string[] = [];
  for (let day = month; day < end; day = addDays(day, 1)) days.push(day);
  return [...Array<null>(lead).fill(null), ...days];
}

export function BookingCalendar({
  month,
  selected,
  available,
  todayKey,
  minMonth,
  maxMonth,
  onSelect,
  onMonthChange,
}: Props) {
  const canBack = month > minMonth;
  const canForward = month < maxMonth;

  return (
    <div className={classes.calendar}>
      <div className={classes.monthBar}>
        <UnstyledButton
          type="button"
          className={classes.monthNav}
          disabled={!canBack}
          aria-label="Previous month"
          onClick={() => onMonthChange(shiftMonth(month, -1))}
        >
          <ChevronLeftIcon size={18} />
        </UnstyledButton>
        <span className={classes.monthTitle}>{monthTitle(month)}</span>
        <UnstyledButton
          type="button"
          className={classes.monthNav}
          disabled={!canForward}
          aria-label="Next month"
          onClick={() => onMonthChange(shiftMonth(month, 1))}
        >
          <ChevronRightIcon size={18} />
        </UnstyledButton>
      </div>

      <div className={classes.grid} role="grid">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className={classes.weekday}>
            {label}
          </span>
        ))}
        {monthCells(month).map((day, index) =>
          day ? (
            <UnstyledButton
              key={day}
              type="button"
              className={classes.day}
              disabled={!available.has(day)}
              data-available={available.has(day) || undefined}
              data-selected={day === selected || undefined}
              data-today={day === todayKey || undefined}
              aria-pressed={day === selected}
              onClick={() => onSelect(day)}
            >
              {Number(day.slice(8))}
            </UnstyledButton>
          ) : (
            <span key={`blank-${index}`} />
          )
        )}
      </div>
    </div>
  );
}

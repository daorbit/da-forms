import { ActionIcon, Switch } from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { PlusIcon, XIcon } from 'lucide-react';
import type { TimeRange } from '@/types';
import { WEEKDAYS } from '@/lib/booking';
import { minutesOf } from '@/lib/bookingSlots';
import classes from './BookingSection.module.css';

interface Props {
  weekly: TimeRange[][];
  onChange: (weekly: TimeRange[][]) => void;
}

const DEFAULT_RANGE: TimeRange = { start: '09:00', end: '17:00' };

function nextRange(ranges: TimeRange[]): TimeRange {
  const last = ranges[ranges.length - 1];
  if (!last) return DEFAULT_RANGE;
  const start = Math.min(minutesOf(last.end) + 60, 23 * 60);
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return { start: fmt(start), end: fmt(Math.min(start + 120, 23 * 60 + 59)) };
}

export function WeeklyHoursEditor({ weekly, onChange }: Props) {
  const days = WEEKDAYS.map((_, i) => weekly[i] ?? []);

  const setDay = (index: number, ranges: TimeRange[]) =>
    onChange(days.map((existing, i) => (i === index ? ranges : existing)));

  return (
    <div className={classes.week}>
      {WEEKDAYS.map((name, index) => {
        const ranges = days[index];
        const open = ranges.length > 0;
        return (
          <div key={name} className={classes.day}>
            <Switch
              size="xs"
              checked={open}
              label={name.slice(0, 3)}
              className={classes.dayToggle}
              onChange={(e) => setDay(index, e.currentTarget.checked ? [DEFAULT_RANGE] : [])}
            />
            <div className={classes.ranges}>
              {!open && <span className={classes.unavailable}>Unavailable</span>}
              {ranges.map((range, r) => {
                const invalid = minutesOf(range.end) <= minutesOf(range.start);
                return (
                  <div key={r} className={classes.range}>
                    <TimeInput
                      size="xs"
                      value={range.start}
                      error={invalid}
                      aria-label={`${name} start`}
                      onChange={(e) =>
                        setDay(index, ranges.map((x, i) => (i === r ? { ...x, start: e.currentTarget.value } : x)))
                      }
                    />
                    <span className={classes.dash}>–</span>
                    <TimeInput
                      size="xs"
                      value={range.end}
                      error={invalid}
                      aria-label={`${name} end`}
                      onChange={(e) =>
                        setDay(index, ranges.map((x, i) => (i === r ? { ...x, end: e.currentTarget.value } : x)))
                      }
                    />
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      aria-label="Remove hours"
                      onClick={() => setDay(index, ranges.filter((_, i) => i !== r))}
                    >
                      <XIcon size={14} />
                    </ActionIcon>
                  </div>
                );
              })}
            </div>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              aria-label={`Add hours on ${name}`}
              onClick={() => setDay(index, [...ranges, nextRange(ranges)])}
            >
              <PlusIcon size={14} />
            </ActionIcon>
          </div>
        );
      })}
    </div>
  );
}

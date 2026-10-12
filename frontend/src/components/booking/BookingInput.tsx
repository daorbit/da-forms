import { useMemo, useState } from 'react';
import { Anchor, Group, Text } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { CalendarCheckIcon, GlobeIcon, TimerIcon, VideoIcon } from 'lucide-react';
import type { FormField } from '@/types';
import { useFormId } from '@/components/FormIdContext';
import { useBookingSlots } from '@/hooks/useBookingSlots';
import { bookingEnd, browserTimeZone, formatBookingRange, withBookingDefaults } from '@/lib/booking';
import { addDays, dateKeyIn } from '@/lib/zonedTime';
import { BookingTimeList } from './BookingTimeList';
import classes from './BookingInput.module.css';

interface Props {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  invalid?: boolean;
}

const monthOf = (dateKey: string) => `${dateKey.slice(0, 7)}-01`;

function dayHeading(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(Date.UTC(y, m - 1, d))
  );
}

export function BookingInput({ field, value, onChange, readOnly, invalid }: Props) {
  const formId = useFormId();
  const config = useMemo(() => withBookingDefaults(field.booking), [field.booking]);
  const visitorZone = useMemo(() => browserTimeZone(), []);
  const todayKey = dateKeyIn(new Date(), visitorZone);
  const selectedKey = value ? dateKeyIn(new Date(value), visitorZone) : null;

  const [month, setMonth] = useState(() => monthOf(selectedKey ?? todayKey));
  const [day, setDay] = useState<string | null>(selectedKey);
  const { slots, loading, failed, reload } = useBookingSlots(formId, field, month);

  const byDay = useMemo(() => {
    const grouped = new Map<string, string[]>();
    for (const iso of slots) {
      const key = dateKeyIn(new Date(iso), visitorZone);
      grouped.set(key, [...(grouped.get(key) ?? []), iso]);
    }
    return grouped;
  }, [slots, visitorZone]);

  const daySlots = day ? (byDay.get(day) ?? []) : [];

  return (
    <div className={classes.root} data-invalid={invalid || undefined}>
      <Group gap="lg" className={classes.meta}>
        <span className={classes.metaItem}>
          <TimerIcon size={14} />
          {config.duration} min
        </span>
        {config.syncCalendar && config.addMeet && (
          <span className={classes.metaItem}>
            <VideoIcon size={14} />
            Google Meet
          </span>
        )}
        <span className={classes.metaItem}>
          <GlobeIcon size={14} />
          {visitorZone}
        </span>
      </Group>

      <div className={classes.picker}>
        <div className={classes.calendar}>
          <DatePicker
            value={day}
            onChange={(next) => setDay(next)}
            date={month}
            onDateChange={(next) => setMonth(monthOf(next))}
            minDate={todayKey}
            maxDate={addDays(todayKey, (config.maxDaysAhead ?? 30) + 1)}
            excludeDate={(date) => !loading && !byDay.has(date)}
            highlightToday
          />
        </div>

        <div className={classes.times}>
          {day ? (
            <>
              <Text size="sm" fw={600} mb={8}>
                {dayHeading(day)}
              </Text>
              <BookingTimeList
                slots={daySlots}
                selected={value}
                timeZone={visitorZone}
                timeFormat={config.timeFormat}
                loading={loading}
                disabled={readOnly}
                onPick={(iso) => !readOnly && onChange(iso === value ? '' : iso)}
              />
            </>
          ) : (
            <Text size="sm" className={classes.timesEmpty}>
              {failed ? (
                <>
                  Could not load times.{' '}
                  <Anchor component="button" type="button" size="sm" onClick={reload}>
                    Try again
                  </Anchor>
                </>
              ) : !loading && !byDay.size ? (
                'No open times this month. Try the next one.'
              ) : (
                'Pick a day to see open times.'
              )}
            </Text>
          )}
        </div>
      </div>

      {value && (
        <div className={classes.chosen}>
          <CalendarCheckIcon size={16} />
          <span>{formatBookingRange(value, bookingEnd(field, value), visitorZone, config.timeFormat)}</span>
        </div>
      )}
    </div>
  );
}

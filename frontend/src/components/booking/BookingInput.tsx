import { useMemo, useState } from 'react';
import { Anchor } from '@mantine/core';
import { CalendarCheckIcon, Clock3Icon, GlobeIcon, VideoIcon } from 'lucide-react';
import type { FormField } from '@/types';
import { useFormId } from '@/components/FormIdContext';
import { useBookingSlots } from '@/hooks/useBookingSlots';
import {
  bookingEnd,
  browserTimeZone,
  formatBookingRange,
  formatSlotTime,
  timeZoneLabel,
  withBookingDefaults,
} from '@/lib/booking';
import { contrastOn } from '@/lib/formTheme';
import { addDays, dateKeyIn } from '@/lib/zonedTime';
import { BookingCalendar } from './BookingCalendar';
import { BookingTimeList } from './BookingTimeList';
import classes from './BookingInput.module.css';

interface Props {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  invalid?: boolean;
  accentColor?: string;
  textColor?: string;
  borderColor?: string;
  surfaceColor?: string;
}

const monthOf = (dateKey: string) => `${dateKey.slice(0, 7)}-01`;

function dayHeading(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' }).format(
    new Date(Date.UTC(y, m - 1, d))
  );
}

function themeVars(accent?: string, text?: string, border?: string, surface?: string): React.CSSProperties {
  return {
    ...(accent ? { '--bk-accent': accent, '--bk-on-accent': contrastOn(accent) } : {}),
    ...(text ? { '--bk-text': text } : {}),
    ...(border ? { '--bk-border': border } : {}),
    ...(surface ? { '--bk-surface': surface } : {}),
  } as React.CSSProperties;
}

export function BookingInput({
  field,
  value,
  onChange,
  readOnly,
  invalid,
  accentColor,
  textColor,
  borderColor,
  surfaceColor,
}: Props) {
  const formId = useFormId();
  const config = useMemo(() => withBookingDefaults(field.booking), [field.booking]);
  const zone = useMemo(() => browserTimeZone(), []);
  const todayKey = dateKeyIn(new Date(), zone);
  const lastKey = addDays(todayKey, (config.maxDaysAhead ?? 30) + 1);
  const selectedKey = value ? dateKeyIn(new Date(value), zone) : null;

  const [month, setMonth] = useState(() => monthOf(selectedKey ?? todayKey));
  const [day, setDay] = useState<string | null>(selectedKey);
  const [pending, setPending] = useState<string | null>(null);
  const { slots, loading, failed, reload } = useBookingSlots(formId, field, month);

  const byDay = useMemo(() => {
    const grouped = new Map<string, string[]>();
    for (const iso of slots) {
      const key = dateKeyIn(new Date(iso), zone);
      grouped.set(key, [...(grouped.get(key) ?? []), iso]);
    }
    return grouped;
  }, [slots, zone]);

  const available = useMemo(() => new Set(byDay.keys()), [byDay]);
  const showMeet = config.syncCalendar && config.addMeet;

  return (
    <div
      className={classes.root}
      data-invalid={invalid || undefined}
      style={themeVars(accentColor, textColor, borderColor, surfaceColor)}
    >
      <div className={classes.header}>
        <span className={classes.metaItem}>
          <Clock3Icon size={15} />
          {config.duration} min
        </span>
        {showMeet && (
          <span className={classes.metaItem}>
            <VideoIcon size={15} />
            Google Meet
          </span>
        )}
        {value && (
          <span className={classes.chosen}>
            <CalendarCheckIcon size={14} />
            {formatBookingRange(value, bookingEnd(field, value), zone, config.timeFormat)}
          </span>
        )}
      </div>

      <div className={classes.body} data-open={day ? true : undefined}>
        <div className={classes.calendarPane}>
          <div className={classes.paneTitle}>Select a date &amp; time</div>
          <BookingCalendar
            month={month}
            selected={day}
            available={available}
            todayKey={todayKey}
            minMonth={monthOf(todayKey)}
            maxMonth={monthOf(lastKey)}
            onSelect={(next) => {
              setDay(next);
              setPending(null);
            }}
            onMonthChange={setMonth}
          />
          {failed && (
            <div className={classes.notice}>
              Could not load times.{' '}
              <Anchor component="button" type="button" size="sm" onClick={reload}>
                Try again
              </Anchor>
            </div>
          )}
          {!failed && !loading && !available.size && (
            <div className={classes.notice}>No open times this month. Try the next one.</div>
          )}
        </div>

        {day && (
          <div className={classes.timesPane}>
            <div className={classes.paneTitle}>{dayHeading(day)}</div>
            <BookingTimeList
              slots={byDay.get(day) ?? []}
              confirmed={value}
              pending={pending}
              timeZone={zone}
              timeFormat={config.timeFormat}
              loading={loading}
              onPick={(iso) => !readOnly && setPending(iso)}
              onConfirm={(iso) => {
                setPending(null);
                if (!readOnly) onChange(iso);
              }}
            />
          </div>
        )}
      </div>

      <div className={classes.footer}>
        <GlobeIcon size={14} />
        {timeZoneLabel(zone)} ({formatSlotTime(new Date(), zone, config.timeFormat)})
      </div>
    </div>
  );
}

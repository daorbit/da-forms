import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { VideoIcon } from 'lucide-react';
import type { Submission } from '@/types';
import { placeDay, type BookingEvent } from './bookingEvents';
import { DAY_NAMES, HOUR_PX, hourLabel, minutesOfDay, rangeLabel, type CalendarDay } from './calendarDates';
import { BookingEventPopover } from './BookingEventPopover';
import classes from './EntriesCalendar.module.css';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

interface Props {
  days: CalendarDay[];
  byDay: Map<string, BookingEvent[]>;
  onOpen: (submission: Submission) => void;
}

function vars(values: Record<string, string | number>): CSSProperties {
  return values as CSSProperties;
}

export function CalendarWeekGrid({ days, byDay, onOpen }: Props) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const nowMinutes = minutesOfDay(new Date());

  const placed = useMemo(
    () => new Map(days.map((day) => [day.key, placeDay(byDay.get(day.key) ?? [])])),
    [days, byDay],
  );

  useEffect(() => {
    if (!bodyRef.current) return;
    const starts = [...placed.values()].flat().map((p) => p.top);
    const earliest = Math.min(8 * 60, ...starts);
    bodyRef.current.scrollTop = Math.max(0, (earliest / 60 - 0.5) * HOUR_PX);
  }, [placed]);

  return (
    <div className={classes.week} style={vars({ '--hour': `${HOUR_PX}px` })}>
      <div className={classes.weekHead}>
        <div className={classes.weekGutterHead}>
          {new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
            .formatToParts(new Date())
            .find((p) => p.type === 'timeZoneName')?.value}
        </div>
        {days.map((day) => (
          <div key={day.key} className={classes.weekDayHead} data-today={day.isToday || undefined}>
            <span className={classes.weekDayName}>{DAY_NAMES[(day.date.getDay() + 6) % 7]}</span>
            <span className={classes.weekDayNum}>{day.date.getDate()}</span>
          </div>
        ))}
      </div>

      <div className={classes.weekBody} ref={bodyRef}>
        <div className={classes.weekGrid}>
          <div className={classes.weekGutter}>
            {HOURS.map((h) => (
              <div key={h} className={classes.weekHourLabel}>
                {h > 0 && <span>{hourLabel(h)}</span>}
              </div>
            ))}
          </div>

          {days.map((day) => (
            <div
              key={day.key}
              className={classes.weekCol}
              data-today={day.isToday || undefined}
              data-weekend={day.isWeekend || undefined}
            >
              {HOURS.map((h) => (
                <div key={h} className={classes.weekSlot} />
              ))}

              {day.isToday && <div className={classes.nowLine} style={vars({ '--top': nowMinutes })} aria-hidden />}

              {(placed.get(day.key) ?? []).map(({ event, top, duration, lane, lanes }) => (
                <BookingEventPopover key={event.id} event={event} onOpen={onOpen}>
                  <button
                    type="button"
                    className={classes.block}
                    data-state={event.state}
                    data-compact={duration < 45 || undefined}
                    style={vars({ '--top': top, '--len': duration, '--lane': lane, '--lanes': lanes })}
                  >
                    <span className={classes.blockName}>{event.title}</span>
                    <span className={classes.blockTime}>
                      {event.meetLink && <VideoIcon size={11} />}
                      {rangeLabel(event.start, event.end)}
                    </span>
                  </button>
                </BookingEventPopover>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

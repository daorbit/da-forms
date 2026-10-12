import { VideoIcon } from 'lucide-react';
import type { Submission } from '@/types';
import type { BookingEvent } from './bookingEvents';
import { DAY_NAMES, rangeLabel, type CalendarDay } from './calendarDates';
import { BookingEventPopover } from './BookingEventPopover';
import classes from './EntriesCalendar.module.css';

const VISIBLE = 2;

interface Props {
  days: CalendarDay[];
  byDay: Map<string, BookingEvent[]>;
  onOpen: (submission: Submission) => void;
  onShowWeek: (date: Date) => void;
}

export function CalendarMonthGrid({ days, byDay, onOpen, onShowWeek }: Props) {
  return (
    <div className={classes.month}>
      {DAY_NAMES.map((name) => (
        <div key={name} className={classes.monthHead}>
          {name}
        </div>
      ))}

      {days.map((day) => {
        const events = byDay.get(day.key) ?? [];
        const hidden = events.length - VISIBLE;
        return (
          <div
            key={day.key}
            className={classes.monthDay}
            data-outside={!day.inMonth || undefined}
            data-weekend={day.isWeekend || undefined}
            data-today={day.isToday || undefined}
          >
            <div className={classes.monthDayHead}>
              <span className={classes.monthDate}>{day.date.getDate()}</span>
            </div>

            <div className={classes.monthStack}>
              {events.slice(0, VISIBLE).map((event) => (
                <BookingEventPopover key={event.id} event={event} onOpen={onOpen}>
                  <button type="button" className={classes.chip} data-state={event.state}>
                    <span className={classes.chipName}>{event.title}</span>
                    <span className={classes.chipMeta}>
                      <span className={classes.chipTime}>{rangeLabel(event.start, event.end)}</span>
                      {event.meetLink && <VideoIcon size={12} className={classes.chipIcon} />}
                    </span>
                  </button>
                </BookingEventPopover>
              ))}
              {hidden > 0 && (
                <button type="button" className={classes.more} onClick={() => onShowWeek(day.date)}>
                  +{hidden} more
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

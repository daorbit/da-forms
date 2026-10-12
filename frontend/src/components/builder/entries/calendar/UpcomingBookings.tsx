import { ActionIcon, Button, Tooltip } from '@mantine/core';
import { CalendarCheckIcon, VideoIcon } from 'lucide-react';
import type { Submission } from '@/types';
import type { BookingEvent } from './bookingEvents';
import { dayKey, timeLabel } from './calendarDates';
import classes from './UpcomingBookings.module.css';

const LIMIT = 8;

interface Props {
  events: BookingEvent[];
  onOpen: (submission: Submission) => void;
}

function dayHeading(date: Date): { label: string; date: string } {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const key = dayKey(date);
  const short = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (key === dayKey(today)) return { label: 'Today', date: short };
  if (key === dayKey(tomorrow)) return { label: 'Tomorrow', date: short };
  return { label: date.toLocaleDateString('en-US', { weekday: 'long' }), date: short };
}

function startsIn(event: BookingEvent): string {
  if (event.state === 'live') return 'Happening now';
  const minutes = Math.round((event.start.getTime() - Date.now()) / 60_000);
  if (minutes < 60) return `Starts in ${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Starts in ${hours} h ${minutes % 60} min`;
  const days = Math.round(hours / 24);
  return `Starts in ${days} ${days === 1 ? 'day' : 'days'}`;
}

function durationOf(event: BookingEvent): string {
  return `${Math.round((event.end.getTime() - event.start.getTime()) / 60_000)} min`;
}

function Person({ event }: { event: BookingEvent }) {
  return (
    <>
      <span className={classes.avatar}>{event.initials}</span>
      <span className={classes.who}>
        <span className={classes.name}>{event.title}</span>
        {event.email && <span className={classes.email}>{event.email}</span>}
      </span>
    </>
  );
}

export function UpcomingBookings({ events, onOpen }: Props) {
  const upcoming = events.filter((e) => e.state !== 'past');
  const [next, ...rest] = upcoming.slice(0, LIMIT);

  const groups: { key: string; heading: ReturnType<typeof dayHeading>; items: BookingEvent[] }[] = [];
  for (const event of rest) {
    const key = dayKey(event.start);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(event);
    else groups.push({ key, heading: dayHeading(event.start), items: [event] });
  }

  return (
    <aside className={classes.root}>
      <div className={classes.head}>
        <span className={classes.title}>Upcoming</span>
        <span className={classes.count}>
          {upcoming.length} {upcoming.length === 1 ? 'booking' : 'bookings'}
        </span>
      </div>

      {!next ? (
        <div className={classes.empty}>
          <span className={classes.emptyIcon}>
            <CalendarCheckIcon size={18} />
          </span>
          <span className={classes.emptyTitle}>You're all clear</span>
          <span className={classes.emptyText}>New bookings will appear here.</span>
        </div>
      ) : (
        <>
          <div className={classes.next} data-live={next.state === 'live' || undefined}>
            <span className={classes.nextLabel}>
              <span className={classes.pulse} />
              {startsIn(next)}
            </span>
            <button type="button" className={classes.person} onClick={() => onOpen(next.submission)}>
              <Person event={next} />
            </button>
            <span className={classes.nextWhen}>
              {dayHeading(next.start).label}, {dayHeading(next.start).date} · {timeLabel(next.start)} – {timeLabel(next.end)}
            </span>
            {next.meetLink && (
              <Button
                component="a"
                href={next.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                size="xs"
                radius="md"
                fullWidth
                leftSection={<VideoIcon size={14} />}
              >
                Join Google Meet
              </Button>
            )}
          </div>

          {groups.map((group) => (
            <div key={group.key} className={classes.group}>
              <div className={classes.day}>
                <span>{group.heading.label}</span>
                <span className={classes.dayDate}>{group.heading.date}</span>
              </div>
              {group.items.map((event) => (
                <div key={event.id} className={classes.row}>
                  <span className={classes.time}>
                    <span>{timeLabel(event.start)}</span>
                    <span className={classes.duration}>{durationOf(event)}</span>
                  </span>
                  <button type="button" className={classes.person} onClick={() => onOpen(event.submission)}>
                    <Person event={event} />
                  </button>
                  {event.meetLink && (
                    <Tooltip label="Join Google Meet" withArrow>
                      <ActionIcon
                        component="a"
                        href={event.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="subtle"
                        color="gray"
                        radius="md"
                        aria-label="Join Google Meet"
                        className={classes.join}
                      >
                        <VideoIcon size={15} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </aside>
  );
}

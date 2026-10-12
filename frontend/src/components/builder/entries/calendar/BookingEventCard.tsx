import { Button, CopyButton, Tooltip, ActionIcon } from '@mantine/core';
import { CalendarIcon, CheckIcon, ClockIcon, CopyIcon, ExternalLinkIcon, VideoIcon } from 'lucide-react';
import type { Submission } from '@/types';
import type { BookingEvent } from './bookingEvents';
import { timeLabel } from './calendarDates';
import classes from './EntriesCalendar.module.css';

const STATE_LABEL = { upcoming: 'Upcoming', live: 'In progress', past: 'Completed' } as const;

interface Props {
  event: BookingEvent;
  onOpen: (submission: Submission) => void;
}

export function BookingEventCard({ event, onOpen }: Props) {
  const minutes = Math.round((event.end.getTime() - event.start.getTime()) / 60_000);

  return (
    <div className={classes.card}>
      <div className={classes.cardHead}>
        <span className={classes.avatar} data-state={event.state}>
          {event.initials}
        </span>
        <div className={classes.cardWho}>
          <span className={classes.cardTitle}>{event.title}</span>
          {event.email && <span className={classes.cardSub}>{event.email}</span>}
        </div>
        <span className={classes.stateBadge} data-state={event.state}>
          {STATE_LABEL[event.state]}
        </span>
      </div>

      <div className={classes.cardRow}>
        <CalendarIcon size={14} />
        {event.start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
      <div className={classes.cardRow}>
        <ClockIcon size={14} />
        {timeLabel(event.start)} – {timeLabel(event.end)}
        <span className={classes.cardMuted}>· {minutes} min</span>
      </div>

      {event.meetLink && (
        <div className={classes.meetRow}>
          <VideoIcon size={14} />
          <a href={event.meetLink} target="_blank" rel="noopener noreferrer" className={classes.meetUrl}>
            {event.meetLink.replace(/^https?:\/\//, '')}
          </a>
          <CopyButton value={event.meetLink}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Copied' : 'Copy link'} withArrow>
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={copy} aria-label="Copy Meet link">
                  {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </div>
      )}

      <div className={classes.cardActions}>
        {event.meetLink && event.state !== 'past' && (
          <Button
            component="a"
            href={event.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            radius="xl"
            leftSection={<VideoIcon size={14} />}
          >
            Join Google Meet
          </Button>
        )}
        {event.eventLink && (
          <Button
            component="a"
            href={event.eventLink}
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            radius="xl"
            variant="default"
            leftSection={<ExternalLinkIcon size={13} />}
          >
            Calendar
          </Button>
        )}
        <Button size="xs" radius="xl" variant="subtle" color="gray" onClick={() => onOpen(event.submission)}>
          Open response
        </Button>
      </div>
    </div>
  );
}

import { Anchor } from '@mantine/core';
import { CalendarCheckIcon, VideoIcon } from 'lucide-react';
import type { BookingTimeFormat, SubmissionBooking } from '@/types';
import { browserTimeZone, formatBookingRange } from '@/lib/booking';
import classes from './BookingConfirmation.module.css';

interface Props {
  booking: SubmissionBooking;
  timeFormat?: BookingTimeFormat;
}

export function BookingConfirmation({ booking, timeFormat }: Props) {
  const zone = browserTimeZone();
  return (
    <div className={classes.card}>
      <div className={classes.row}>
        <CalendarCheckIcon size={18} className={classes.icon} />
        <div>
          <div className={classes.title}>{formatBookingRange(booking.start, booking.end, zone, timeFormat)}</div>
          <div className={classes.hint}>{zone}</div>
        </div>
      </div>
      {booking.meetLink && (
        <div className={classes.row}>
          <VideoIcon size={18} className={classes.icon} />
          <Anchor href={booking.meetLink} target="_blank" rel="noopener noreferrer" className={classes.link}>
            Join with Google Meet
          </Anchor>
        </div>
      )}
      {booking.eventLink && <div className={classes.hint}>A calendar invite is on its way to your email.</div>}
    </div>
  );
}

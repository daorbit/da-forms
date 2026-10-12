import { VideoIcon } from 'lucide-react';
import type { FormField, Submission } from '@/types';
import { bookingEnd, browserTimeZone, formatShortRange } from '@/lib/booking';
import { answerText } from './entriesTypes';
import classes from './BookingCell.module.css';

interface Props {
  field: FormField;
  submission: Submission;
}

export function BookingCell({ field, submission }: Props) {
  const start = submission.booking?.start ?? answerText(submission.data[field.id]);
  if (!start) return <span className={classes.empty}>—</span>;

  const end = submission.booking?.end ?? bookingEnd(field, start);
  const meetLink = submission.booking?.meetLink;
  const past = new Date(end).getTime() < Date.now();

  return (
    <div className={classes.root}>
      <span className={classes.time}>
        {formatShortRange(start, end, browserTimeZone(), field.booking?.timeFormat)}
      </span>
      {meetLink && (
        <a
          href={meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className={classes.meet}
          data-past={past || undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <VideoIcon size={12} />
          {past ? 'Meet link' : 'Join Meet'}
        </a>
      )}
    </div>
  );
}

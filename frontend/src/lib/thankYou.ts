import type { SubmissionBooking } from '@/types';

export const DEFAULT_THANK_YOU = 'Thanks! Your response has been recorded.';

const ALREADY_SAYS_RECEIVED = /recorded|received|reached|got it|submitted/i;

interface Input {
  edited: boolean;
  message?: string | null;
  booking?: SubmissionBooking | null;
}

export interface ThankYouCopy {
  title: string;
  lines: string[];
  againLabel: string;
}

export function thankYouCopy({ edited, message, booking }: Input): ThankYouCopy {
  if (edited) {
    return { title: 'Your changes are saved.', lines: ['Your response has been updated.'], againLabel: '' };
  }

  const custom = message?.trim() && message.trim() !== DEFAULT_THANK_YOU ? message.trim() : '';

  if (booking) {
    return {
      title: custom || 'You’re booked in',
      lines: [
        booking.eventLink
          ? 'A calendar invite with the details is on its way to your inbox.'
          : 'We’ve saved your booking and will see you then.',
      ],
      againLabel: 'Book another time',
    };
  }

  const title = custom || message?.trim() || 'Thanks — that reached us.';
  return {
    title,
    lines: ALREADY_SAYS_RECEIVED.test(title)
      ? ['You can safely close this page now.']
      : ['Your response has been recorded.', 'You can safely close this page now.'],
    againLabel: 'Submit another response',
  };
}

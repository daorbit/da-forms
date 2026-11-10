import { useMemo } from 'react';
import type { FormField, Submission } from '@/types';
import { bookingEvents } from './bookingEvents';
import { BookingsCalendarView } from './BookingsCalendarView';

interface Props {
  fields: FormField[];
  submissions: Submission[];
  loading: boolean;
  onOpen: (submission: Submission) => void;
}

export function EntriesCalendar({ fields, submissions, loading, onOpen }: Props) {
  const events = useMemo(() => bookingEvents(fields, submissions), [fields, submissions]);
  return (
    <BookingsCalendarView
      events={events}
      loading={loading}
      onOpen={(event) => {
        if (event.submission) onOpen(event.submission);
      }}
    />
  );
}

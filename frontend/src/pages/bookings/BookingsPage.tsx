import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DocsButton } from '@/components/ui/DocsButton';
import { HostNotificationsBell } from '@/components/HostNotificationsBell';
import { BookingsCalendarView } from '@/components/builder/entries/calendar/BookingsCalendarView';
import { IS_EMBEDDED } from '@/lib/bootParams';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { useBookingsCalendar } from '@/hooks/useBookingsCalendar';
import analytics from '@/pages/formAnalytics/FormAnalytics.module.css';
import { bookingCalendarEvents } from './bookingCalendarEvents';

const EMPTY: never[] = [];

export default function BookingsPage() {
  const workspaceId = useWorkspaceId();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<{ from: Date; to: Date } | null>(null);
  const { data, loading } = useBookingsCalendar(workspaceId, period);
  const events = useMemo(() => bookingCalendarEvents(data?.bookings ?? EMPTY), [data]);
  const onPeriod = useCallback((from: Date, to: Date) => setPeriod({ from, to }), []);

  return (
    <div className={analytics.page}>
      <PageHeader
        title="Bookings"
        description="Every meeting booked through your forms, on one calendar."
        actions={
          <>
            <DocsButton path="/lead-capture" />
            {IS_EMBEDDED && <HostNotificationsBell />}
          </>
        }
      />
      <BookingsCalendarView
        events={events}
        loading={loading || !data}
        onPeriod={onPeriod}
        onOpen={(event) => {
          if (event.formId) navigate(`/${workspaceId}/forms/${event.formId}/entries`);
        }}
      />
    </div>
  );
}

import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DocsButton } from '@/components/ui/DocsButton';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { HostNotificationsBell } from '@/components/HostNotificationsBell';
import { BookingsCalendarView } from '@/components/builder/entries/calendar/BookingsCalendarView';
import { IS_EMBEDDED } from '@/lib/bootParams';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { useBookingsCalendar } from '@/hooks/useBookingsCalendar';
import analytics from '@/pages/formAnalytics/FormAnalytics.module.css';
import { bookingCalendarEvents } from './bookingCalendarEvents';
import { BookingsToolbar } from './BookingsToolbar';
import { BookingsStats } from './BookingsStats';
import { bookingStats } from './bookingStats';
import { filterBookings, filterByStatus, type BookingStatusFilter } from './filterBookings';

const EMPTY: never[] = [];

export default function BookingsPage() {
  const workspaceId = useWorkspaceId();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const formId = params.get('form');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<BookingStatusFilter>('all');
  const [period, setPeriod] = useState<{ from: Date; to: Date } | null>(null);
  const { data, loading, reload } = useBookingsCalendar(workspaceId, period);

  const forms = data?.forms ?? EMPTY;
  const bookings = data?.bookings ?? EMPTY;
  const matched = useMemo(
    () => bookingCalendarEvents(filterBookings(bookings, query, formId)),
    [bookings, query, formId],
  );
  const events = useMemo(() => filterByStatus(matched, status), [matched, status]);
  const stats = useMemo(() => bookingStats(matched), [matched]);

  const onPeriod = useCallback((from: Date, to: Date) => setPeriod({ from, to }), []);
  const onForm = (id: string | null) => {
    const search = new URLSearchParams(params);
    if (id) search.set('form', id);
    else search.delete('form');
    setParams(search, { replace: true });
  };

  return (
    <div className={analytics.page}>
      <PageHeader
        title="Bookings"
        description="Every meeting booked through your forms, on one calendar."
        actions={
          <>
            <RefreshButton onRefresh={reload} refreshing={loading && Boolean(data)} hint="Refresh bookings" />
            <DocsButton path="/lead-capture" />
            {IS_EMBEDDED && <HostNotificationsBell />}
          </>
        }
      />
      <BookingsToolbar
        query={query}
        onQuery={setQuery}
        formId={formId}
        onForm={onForm}
        status={status}
        onStatus={setStatus}
        forms={forms}
      />
      <BookingsStats stats={stats} />
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

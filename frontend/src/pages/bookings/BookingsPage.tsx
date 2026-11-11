import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DocsButton } from '@/components/ui/DocsButton';
import { ViewFormsLink } from '@/components/ui/ViewFormsLink';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { UpdatedAgo } from '@/components/ui/UpdatedAgo';
import { ExportButton } from '@/components/ui/ExportButton';
import { HostNotificationsBell } from '@/components/HostNotificationsBell';
import { BookingsCalendarView } from '@/components/builder/entries/calendar/BookingsCalendarView';
import { CalendarFormLegend } from '@/components/builder/entries/calendar/CalendarFormLegend';
import { IS_EMBEDDED } from '@/lib/bootParams';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { useBookingsCalendar } from '@/hooks/useBookingsCalendar';
import { useRememberedParams } from '@/hooks/useRememberedParams';
import analytics from '@/pages/formAnalytics/FormAnalytics.module.css';
import { bookingCalendarEvents } from './bookingCalendarEvents';
import { BookingsToolbar } from './BookingsToolbar';
import { BookingsEmpty } from './BookingsEmpty';
import { bookingCounts } from './bookingStats';
import { exportBookingsCsv } from './bookingsExport';
import { legendForms } from './bookingLegend';
import { filterBookings, filterByStatus, type BookingStatusFilter } from './filterBookings';

const EMPTY: never[] = [];
const REMEMBERED = ['form'];

function emptyHintFor(query: string, status: BookingStatusFilter, formId: string | null): string {
  if (query || status !== 'all' || formId) return 'Try clearing the search or filters.';
  return 'Add a booking field to a form and share it to start taking meetings.';
}

export default function BookingsPage() {
  const workspaceId = useWorkspaceId();
  const navigate = useNavigate();
  useRememberedParams(REMEMBERED);
  const [params, setParams] = useSearchParams();
  const formId = params.get('form');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<BookingStatusFilter>('all');
  const [period, setPeriod] = useState<{ from: Date; to: Date } | null>(null);
  const { data, loading, reload, updatedAt } = useBookingsCalendar(workspaceId, period);

  const forms = data?.forms ?? EMPTY;
  const bookings = data?.bookings ?? EMPTY;
  const matched = useMemo(
    () => bookingCalendarEvents(filterBookings(bookings, query, formId)),
    [bookings, query, formId],
  );
  const events = useMemo(() => filterByStatus(matched, status), [matched, status]);
  const counts = useMemo(() => bookingCounts(matched), [matched]);
  const legend = useMemo(() => legendForms(bookings), [bookings]);

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
            <ViewFormsLink />
            <UpdatedAgo at={updatedAt} />
            <ExportButton
              onExport={() => exportBookingsCsv(events)}
              disabled={!events.length}
              hint="Export bookings in view"
            />
            <RefreshButton onRefresh={reload} refreshing={loading && Boolean(data)} hint="Refresh bookings" />
            <DocsButton path="/lead-capture" />
            {IS_EMBEDDED && <HostNotificationsBell />}
          </>
        }
      />
      {data && forms.length === 0 ? (
        <BookingsEmpty />
      ) : (
        <>
      <BookingsToolbar
        query={query}
        onQuery={setQuery}
        formId={formId}
        onForm={onForm}
        status={status}
        onStatus={setStatus}
        forms={forms}
        counts={counts}
      />
      <BookingsCalendarView
        events={events}
        loading={loading && Boolean(data)}
        skeleton={!data}
        legend={<CalendarFormLegend forms={legend} activeId={formId} onPick={onForm} />}
        emptyHint={emptyHintFor(query, status, formId)}
        onPeriod={onPeriod}
        onOpen={(event) => {
          if (event.formId) navigate(`/${workspaceId}/forms/${event.formId}/entries`);
        }}
      />
        </>
      )}
    </div>
  );
}

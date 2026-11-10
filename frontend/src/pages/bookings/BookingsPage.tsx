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
import { FormLegend } from './FormLegend';
import { countByForm, filterBookings, filterByStatus, type BookingStatusFilter } from './filterBookings';

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
  const formIds = useMemo(() => forms.map((f) => f.id), [forms]);
  const counts = useMemo(() => countByForm(bookings), [bookings]);
  const events = useMemo(
    () => filterByStatus(bookingCalendarEvents(filterBookings(bookings, query, formId), formIds), status),
    [bookings, query, formId, formIds, status],
  );

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
      <FormLegend forms={forms} counts={counts} formId={formId} onForm={onForm} />
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

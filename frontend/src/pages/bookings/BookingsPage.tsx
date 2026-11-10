import { PageHeader } from '@/components/ui/PageHeader';
import { DocsButton } from '@/components/ui/DocsButton';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { HostNotificationsBell } from '@/components/HostNotificationsBell';
import { IS_EMBEDDED } from '@/lib/bootParams';
import type { BookingRange } from '@/lib/api';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { useBookingSummary } from '@/hooks/useBookingSummary';
import { AnalyticsSkeleton } from '@/pages/formAnalytics/AnalyticsSkeleton';
import { BreakdownCard } from '@/pages/formAnalytics/BreakdownCard';
import analytics from '@/pages/formAnalytics/FormAnalytics.module.css';
import { BookingsTiles } from './BookingsTiles';
import { UpcomingBookingsCard } from './UpcomingBookingsCard';
import classes from './BookingsPage.module.css';

const RANGES: { value: BookingRange; label: string }[] = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '365d', label: '12 months' },
];

export default function BookingsPage() {
  const workspaceId = useWorkspaceId();
  const { data, range, setRange, loading } = useBookingSummary(workspaceId);

  return (
    <div className={analytics.page}>
      <PageHeader
        title="Bookings"
        description="Meetings booked through your forms, and what is coming up next."
        actions={
          <>
            <DocsButton path="/lead-capture" />
            {IS_EMBEDDED && <HostNotificationsBell />}
          </>
        }
      />

      <div className={analytics.toolbar}>
        <SegmentedTabs value={range} onChange={setRange} data={RANGES} ariaLabel="Date range" />
      </div>

      {!data ? (
        <AnalyticsSkeleton />
      ) : (
        <div className={classes.stack} data-loading={loading || undefined}>
          <BookingsTiles data={data} range={range} />
          <div className={analytics.split}>
            <UpcomingBookingsCard upcoming={data.upcoming} />
            <BreakdownCard
              title="Bookings by form"
              tone="teal"
              totalLabel="Bookings"
              items={data.byForm.map((f) => ({ key: f.formId, label: f.name || 'Untitled form', value: f.bookings }))}
              empty="Add a booking field to a form to start taking meetings."
            />
          </div>
        </div>
      )}
    </div>
  );
}

import { PageHeader } from '@/components/ui/PageHeader';
import { DocsButton } from '@/components/ui/DocsButton';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { HostNotificationsBell } from '@/components/HostNotificationsBell';
import { LeadSourcesCard } from '@/components/builder/insights/LeadSourcesCard';
import { LeadSourcesHint } from '@/components/builder/insights/LeadSourcesHint';
import { IS_EMBEDDED } from '@/lib/bootParams';
import type { LeadSourceRange } from '@/lib/api';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { useWorkspaceLeadSources } from '@/hooks/useWorkspaceLeadSources';
import { AnalyticsSkeleton } from '@/pages/formAnalytics/AnalyticsSkeleton';
import analytics from '@/pages/formAnalytics/FormAnalytics.module.css';
import { LeadSourcesTiles } from './LeadSourcesTiles';
import classes from './LeadSourcesPage.module.css';

const RANGES: { value: LeadSourceRange; label: string }[] = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '365d', label: '12 months' },
  { value: 'all', label: 'All time' },
];

export default function LeadSourcesPage() {
  const workspaceId = useWorkspaceId();
  const { data, range, setRange, loading } = useWorkspaceLeadSources(workspaceId, true);

  return (
    <div className={analytics.page}>
      <PageHeader
        title="Lead sources"
        description="Which marketing brings leads, and which of them you win, across every form."
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
          <LeadSourcesTiles data={data} />
          <LeadSourcesCard
            items={data.sources}
            limit={25}
            empty={data.forms ? 'No responses in this period yet.' : 'Create a form to start collecting leads.'}
            footer={<LeadSourcesHint legacyEmbeds={data.legacyEmbeds} />}
          />
        </div>
      )}
    </div>
  );
}

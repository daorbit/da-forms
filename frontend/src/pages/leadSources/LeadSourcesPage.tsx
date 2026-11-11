import { useSearchParams } from 'react-router-dom';
import { MegaphoneIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DocsButton } from '@/components/ui/DocsButton';
import { ViewFormsLink } from '@/components/ui/ViewFormsLink';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { UpdatedAgo } from '@/components/ui/UpdatedAgo';
import { ExportButton } from '@/components/ui/ExportButton';
import { useRememberedParams } from '@/hooks/useRememberedParams';
import { exportSourcesCsv } from '@/pages/formAnalytics/analyticsExport';
import { EmptyState } from '@/components/ui/EmptyState';
import { HostNotificationsBell } from '@/components/HostNotificationsBell';
import { LeadSourcesCard } from '@/components/builder/insights/LeadSourcesCard';
import { LeadSourcesHint } from '@/components/builder/insights/LeadSourcesHint';
import { IS_EMBEDDED } from '@/lib/bootParams';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import type { AnalyticsRange, FormsAnalytics } from '@/types/formsAnalytics';
import { useFormsAnalytics } from '@/pages/formAnalytics/useFormsAnalytics';
import { AnalyticsToolbar } from '@/pages/formAnalytics/AnalyticsToolbar';
import { AnalyticsSkeleton } from '@/pages/formAnalytics/AnalyticsSkeleton';
import { BreakdownCard } from '@/pages/formAnalytics/BreakdownCard';
import { TrendCard } from '@/pages/formAnalytics/TrendCard';
import { label } from '@/pages/formAnalytics/analyticsFormat';
import analytics from '@/pages/formAnalytics/FormAnalytics.module.css';
import { LeadSourcesTiles } from './LeadSourcesTiles';

const RANGES: AnalyticsRange[] = ['7d', '30d', '90d'];
const REMEMBERED = ['form', 'range'];

function readRange(value: string | null): AnalyticsRange {
  return RANGES.includes(value as AnalyticsRange) ? (value as AnalyticsRange) : '30d';
}

function Sections({ data, range }: { data: FormsAnalytics; range: AnalyticsRange }) {
  return (
    <div className={analytics.stack}>
      <LeadSourcesTiles data={data} range={range} />
      <div className={analytics.split}>
        <TrendCard daily={data.daily} />
        <BreakdownCard
          title="Source mix"
          chart="donut"
          tone="blue"
          totalLabel="Leads"
          items={data.sources.map((s) => ({ key: s.source, label: s.source, value: s.count }))}
          empty="No leads in this period."
        />
      </div>
      <LeadSourcesCard
        items={data.sources}
        limit={25}
        empty={data.forms.length ? 'No responses in this period yet.' : 'Create a form to start collecting leads.'}
        footer={<LeadSourcesHint legacyEmbeds={0} />}
      />
      <div className={analytics.thirds}>
        <BreakdownCard
          title="Campaigns"
          tone="orange"
          totalLabel="Leads"
          items={data.campaigns.map((c) => ({ key: c.campaign, label: c.campaign, value: c.count }))}
          empty="Add utm_campaign to a form link to see campaigns here."
        />
        <BreakdownCard
          title="Pipeline"
          tone="emerald"
          totalLabel="Leads"
          items={data.stages.map((s) => ({ key: s.stage, label: label(s.stage), value: s.count }))}
          empty="No leads in this period."
        />
        <BreakdownCard
          title="Devices"
          chart="donut"
          tone="violet"
          totalLabel="Leads"
          items={data.devices
            .filter((d) => d.device !== 'unknown')
            .map((d) => ({ key: d.device, label: label(d.device), value: d.count }))}
          empty="Devices appear as new leads arrive."
        />
      </div>
    </div>
  );
}

export default function LeadSourcesPage() {
  const workspaceId = useWorkspaceId();
  useRememberedParams(REMEMBERED);
  const [params, setParams] = useSearchParams();
  const range = readRange(params.get('range'));
  const formId = params.get('form');
  const { data, updatedAt, loading, refreshing, refresh } = useFormsAnalytics(workspaceId, range, formId);

  const update = (next: { range?: AnalyticsRange; form?: string | null }) => {
    const search = new URLSearchParams(params);
    if (next.range) search.set('range', next.range);
    if (next.form !== undefined) {
      if (next.form) search.set('form', next.form);
      else search.delete('form');
    }
    setParams(search, { replace: true });
  };

  return (
    <div className={analytics.page}>
      <PageHeader
        title="Lead sources"
        description="Which marketing brings leads, and which of them you win, across every form."
        actions={
          <>
            <ViewFormsLink />
            <UpdatedAgo at={updatedAt} />
            <ExportButton onExport={() => data && exportSourcesCsv(data)} disabled={!data} hint="Export sources" />
            <RefreshButton onRefresh={refresh} refreshing={refreshing} hint="Refresh numbers" />
            <DocsButton path="/lead-capture" />
            {IS_EMBEDDED && <HostNotificationsBell />}
          </>
        }
      />

      <AnalyticsToolbar
        range={range}
        onRange={(r) => update({ range: r })}
        formId={formId}
        onForm={(id) => update({ form: id })}
        forms={data?.forms ?? []}
      />

      {loading ? (
        <AnalyticsSkeleton />
      ) : !data || data.forms.length === 0 ? (
        <EmptyState
          icon={MegaphoneIcon}
          title="No leads to trace yet"
          description="Share a form with UTM tags on its links. Each lead's source shows up here."
        />
      ) : (
        <Sections data={data} range={range} />
      )}
    </div>
  );
}

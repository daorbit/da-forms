import { useNavigate, useSearchParams } from 'react-router-dom';
import { ActionIcon, Tooltip } from '@mantine/core';
import { ArrowLeftIcon, ChartNoAxesColumnIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DocsButton } from '@/components/ui/DocsButton';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { HostNotificationsBell } from '@/components/HostNotificationsBell';
import { IS_EMBEDDED } from '@/lib/bootParams';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import type { AnalyticsRange, FormsAnalytics } from '@/types/formsAnalytics';
import { useFormsAnalytics } from './useFormsAnalytics';
import { AnalyticsToolbar } from './AnalyticsToolbar';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';
import { KpiStrip } from './KpiStrip';
import { TrendCard } from './TrendCard';
import { CalloutsCard } from './CalloutsCard';
import { PerformanceList } from './PerformanceList';
import { FunnelCard } from './FunnelCard';
import { BreakdownCard } from './BreakdownCard';
import { QualityCard } from './QualityCard';
import { HeatmapCard } from './HeatmapCard';
import { label } from './analyticsFormat';
import classes from './FormAnalytics.module.css';

const RANGES: AnalyticsRange[] = ['7d', '30d', '90d'];

function readRange(value: string | null): AnalyticsRange {
  return RANGES.includes(value as AnalyticsRange) ? (value as AnalyticsRange) : '30d';
}

function Dashboard({ data, onOpen }: { data: FormsAnalytics; onOpen: (id: string) => void }) {
  return (
    <div className={classes.stack}>
      <KpiStrip data={data} />
      <div className={classes.split}>
        <TrendCard daily={data.daily} />
        <CalloutsCard data={data} />
      </div>
      {!data.formId && <PerformanceList forms={data.performance} onOpen={onOpen} />}
      <div className={classes.thirds}>
        <FunnelCard data={data} />
        <BreakdownCard
          title="Where responses come from"
          chart="donut"
          tone="teal"
          items={data.sources.map((s) => ({ key: s.source, label: s.source, value: s.count }))}
          empty="No responses in this period."
        />
        <BreakdownCard
          title="Devices"
          chart="donut"
          tone="violet"
          items={data.devices
            .filter((d) => d.device !== 'unknown')
            .map((d) => ({ key: d.device, label: label(d.device), value: d.count }))}
          empty="Devices appear as new responses arrive."
        />
      </div>
      <div className={classes.split}>
        <HeatmapCard heatmap={data.heatmap} />
        <QualityCard data={data} />
      </div>
      <div className={classes.split}>
        <BreakdownCard
          title="Campaigns"
          tone="orange"
          items={data.campaigns.map((c) => ({ key: c.campaign, label: c.campaign, value: c.count }))}
          empty="Add utm_campaign to a form link to see campaigns here."
        />
        <BreakdownCard
          title="Pipeline"
          tone="emerald"
          items={data.stages.map((s) => ({ key: s.stage, label: label(s.stage), value: s.count }))}
          empty="No responses in this period."
        />
      </div>
    </div>
  );
}

export default function FormAnalyticsPage() {
  const workspaceId = useWorkspaceId();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const range = readRange(params.get('range'));
  const formId = params.get('form');
  const { data, loading, refreshing, refresh } = useFormsAnalytics(workspaceId, range, formId);

  const update = (next: { range?: AnalyticsRange; form?: string | null }) => {
    const search = new URLSearchParams(params);
    if (next.range) search.set('range', next.range);
    if (next.form !== undefined) {
      if (next.form) search.set('form', next.form);
      else search.delete('form');
    }
    setParams(search, { replace: true });
  };

  const back = () => navigate(`/${workspaceId}/forms`);
  const picked = data?.forms.find((f) => f.id === formId);

  return (
    <div className={classes.page}>
      <PageHeader
        leading={
          <Tooltip label="Back to forms" withArrow>
            <ActionIcon variant="default" size="lg" radius="md" aria-label="Back to forms" onClick={back}>
              <ArrowLeftIcon size={17} />
            </ActionIcon>
          </Tooltip>
        }
        title="Form analytics"
        description={picked ? `How ${picked.title || 'this form'} is performing.` : 'How every form in this workspace is performing.'}
        actions={
          <>
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
          icon={ChartNoAxesColumnIcon}
          title="No forms to measure yet"
          description="Create and share a form. Views and responses show up here as they arrive."
          action={{ label: 'Go to forms', onClick: back }}
        />
      ) : (
        <Dashboard data={data} onOpen={(id) => update({ form: id })} />
      )}
    </div>
  );
}

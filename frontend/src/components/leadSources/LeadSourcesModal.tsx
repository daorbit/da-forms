import { Loader, Modal, SegmentedControl } from '@mantine/core';
import type { LeadSourceRange } from '@/lib/api';
import { LeadSourcesCard } from '@/components/builder/insights/LeadSourcesCard';
import { LeadSourcesHint } from '@/components/builder/insights/LeadSourcesHint';
import insights from '@/components/builder/insights/InsightsModal.module.css';
import { useWorkspaceLeadSources } from '@/hooks/useWorkspaceLeadSources';
import classes from './LeadSourcesModal.module.css';

const RANGES: { value: LeadSourceRange; label: string }[] = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '365d', label: '12 months' },
  { value: 'all', label: 'All time' },
];

interface Props {
  opened: boolean;
  workspaceId: string;
  onClose: () => void;
}

export function LeadSourcesModal({ opened, workspaceId, onClose }: Props) {
  const { data, range, setRange, loading } = useWorkspaceLeadSources(workspaceId, opened);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size={680}
      centered
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.65, blur: 2 }}
      classNames={{ header: insights.header, body: insights.body }}
      title={
        <span className={insights.titleWrap}>
          <span className={insights.title}>Lead sources</span>
          <span className={insights.subtitle}>Which marketing brings leads, and which of them you win, across every form.</span>
        </span>
      }
    >
      <SegmentedControl
        size="xs"
        radius="md"
        value={range}
        onChange={(value) => setRange(value as LeadSourceRange)}
        data={RANGES}
        className={classes.range}
      />
      {!data ? (
        <div className={insights.loading}>
          <Loader size="sm" />
        </div>
      ) : (
        <div className={classes.content} data-loading={loading || undefined}>
          <LeadSourcesCard
            items={data.sources}
            limit={12}
            empty={data.forms ? 'No responses in this period yet.' : 'Create a form to start collecting leads.'}
            footer={<LeadSourcesHint />}
          />
        </div>
      )}
    </Modal>
  );
}

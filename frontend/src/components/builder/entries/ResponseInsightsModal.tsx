import { Loader, Modal } from '@mantine/core';
import { UserXIcon } from 'lucide-react';
import type { Analytics } from '@/lib/api';
import type { FormField } from '@/types';
import { valueFields } from '@/lib/fieldTree';
import { InsightKpis } from '@/components/builder/insights/InsightKpis';
import { ActivityChart } from '@/components/builder/insights/ActivityChart';
import { RankedList } from '@/components/builder/insights/RankedList';
import { LeadSourcesCard } from '@/components/builder/insights/LeadSourcesCard';
import { LeadSourcesHint } from '@/components/builder/insights/LeadSourcesHint';
import classes from '@/components/builder/insights/InsightsModal.module.css';

interface Props {
  opened: boolean;
  analytics: Analytics | null;
  fields: FormField[];
  onClose: () => void;
}

export function ResponseInsightsModal({ opened, analytics, fields, onClose }: Props) {
  const labels = new Map(valueFields(fields).map((f) => [f.id, f.label]));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size={760}
      centered
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.65, blur: 2 }}
      classNames={{ header: classes.header, body: classes.body }}
      title={
        <span className={classes.titleWrap}>
          <span className={classes.title}>Form insights</span>
          <span className={classes.subtitle}>All-time totals, with the last 14 days of activity.</span>
        </span>
      }
    >
      {!analytics ? (
        <div className={classes.loading}>
          <Loader size="sm" />
        </div>
      ) : (
        <>
          <InsightKpis analytics={analytics} />
          <ActivityChart daily={analytics.daily ?? []} />
          <LeadSourcesCard
            items={analytics.sources}
            empty="No responses yet, so no sources to show."
            footer={<LeadSourcesHint />}
          />
          <RankedList
            title="Where people stop"
            icon={<UserXIcon size={14} />}
            unit="left"
            items={analytics.dropOff.map((d) => ({
              key: d.fieldId,
              label: labels.get(d.fieldId) || 'Deleted question',
              value: d.abandoned,
            }))}
            empty={
              analytics.partialsEnabled
                ? 'Nobody has left this form unfinished yet.'
                : 'Turn on “Save partial responses” in Quick Settings to see which question people stop at.'
            }
          />
        </>
      )}
    </Modal>
  );
}

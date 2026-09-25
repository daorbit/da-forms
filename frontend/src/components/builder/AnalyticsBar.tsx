import { useState } from 'react';
import { Text, Group, Stack, Progress, Modal } from '@mantine/core';
import {
  IconEye,
  IconInbox,
  IconTrendingUp,
  IconWorld,
  IconUserOff,
} from '@tabler/icons-react';
import type { Analytics } from '@/lib/api';
import type { FormField } from '@/types';
import { valueFields } from '@/lib/fieldTree';
import { StatCards } from '@/components/ui/StatCards';

function SourceBreakdown({ sources }: { sources: Analytics['sources'] }) {
  if (sources.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        No submissions yet.
      </Text>
    );
  }
  const total = sources.reduce((sum, s) => sum + s.count, 0);

  return (
    <Stack gap="xs">
      {sources.map(({ source, count }) => (
        <div key={source}>
          <Group justify="space-between" mb={4}>
            <Text size="sm">{source}</Text>
            <Text size="sm" c="dimmed">
              {count.toLocaleString()} ({Math.round((count / total) * 100)}%)
            </Text>
          </Group>
          <Progress
            value={(count / total) * 100}
            size="sm"
            color="gray"
            styles={{ root: { backgroundColor: 'var(--mantine-color-default-hover)' } }}
          />
        </div>
      ))}
    </Stack>
  );
}

/**
 * Where people stopped, worst first.
 *
 * Labels come from the form's own fields rather than the report, which stores
 * only ids — a question renamed since someone abandoned it should read as it
 * does now. A field that has since been deleted has no label to show, and is
 * named as such instead of being dropped: the abandonment still happened.
 */
function DropOffBreakdown({
  dropOff,
  fields,
  enabled,
}: {
  dropOff: Analytics['dropOff'];
  fields: FormField[];
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <Text size="sm" c="dimmed" py="md">
        Turn on “Save partial responses” in Quick Settings to see which question people give up
        on. Nothing is recorded until you do.
      </Text>
    );
  }
  if (dropOff.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        Nobody has abandoned this form yet.
      </Text>
    );
  }

  const byId = new Map(valueFields(fields).map((f) => [f.id, f.label]));
  const total = dropOff.reduce((sum, d) => sum + d.abandoned, 0);

  return (
    <Stack gap="xs">
      {dropOff.map(({ fieldId, abandoned }) => (
        <div key={fieldId}>
          <Group justify="space-between" mb={4} wrap="nowrap">
            <Text size="sm" truncate>
              {byId.get(fieldId) || 'Deleted question'}
            </Text>
            <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
              {abandoned.toLocaleString()} ({Math.round((abandoned / total) * 100)}%)
            </Text>
          </Group>
          <Progress
            value={(abandoned / total) * 100}
            size="sm"
            color="gray"
            styles={{ root: { backgroundColor: 'var(--mantine-color-default-hover)' } }}
          />
        </div>
      ))}
    </Stack>
  );
}

export function AnalyticsBar({
  analytics,
  fields = [],
}: {
  analytics: Analytics | null;
  /** The form's own fields, for naming the drop-off points. */
  fields?: FormField[];
}) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [dropOffOpen, setDropOffOpen] = useState(false);

  const dropOffLabel =
    analytics && analytics.partialsEnabled && analytics.dropOff.length > 0
      ? valueFields(fields).find((f) => f.id === analytics.dropOff[0].fieldId)?.label ?? 'Deleted question'
      : analytics && !analytics.partialsEnabled
        ? 'Not tracked'
        : '—';

  return (
    <>
      <StatCards
        count={5}
        items={
          analytics
            ? [
                { label: 'views', icon: <IconEye size={18} />, value: analytics.viewCount.toLocaleString() },
                { label: 'responses', icon: <IconInbox size={18} />, value: analytics.submissionCount.toLocaleString() },
                {
                  label: 'completion rate',
                  icon: <IconTrendingUp size={18} />,
                  value: `${Math.round(analytics.completionRate * 100)}%`,
                },
                {
                  label: 'top traffic source',
                  icon: <IconWorld size={18} />,
                  value: analytics.sources[0]?.source ?? '—',
                  onClick: () => setSourcesOpen(true),
                },
                {
                  label: analytics.partialsEnabled ? 'where most gave up' : 'drop-off',
                  icon: <IconUserOff size={18} />,
                  value: dropOffLabel,
                  onClick: () => setDropOffOpen(true),
                },
              ]
            : null
        }
      />

      <Modal
        opened={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        title="Traffic sources"
        centered
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.65, blur: 2 }}
      >
        <SourceBreakdown sources={analytics?.sources ?? []} />
      </Modal>

      <Modal
        opened={dropOffOpen}
        onClose={() => setDropOffOpen(false)}
        title="Where people gave up"
        centered
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.65, blur: 2 }}
      >
        <DropOffBreakdown
          dropOff={analytics?.dropOff ?? []}
          fields={fields}
          enabled={analytics?.partialsEnabled ?? false}
        />
      </Modal>
    </>
  );
}

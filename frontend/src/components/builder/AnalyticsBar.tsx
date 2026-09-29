import { useState } from 'react';
import { Text, Group, Stack, Progress, Modal } from '@mantine/core';
import { EyeIcon, GlobeIcon, InboxIcon, TrendingUpIcon, UserXIcon } from 'lucide-react';
import type { Analytics } from '@/lib/api';
import type { FormField } from '@/types';
import { valueFields } from '@/lib/fieldTree';
import { StatStrip, type StatItem } from '@/components/ui/StatStrip';

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

  const daily = analytics?.daily ?? [];
  // Last 7 days against the 7 before. Null when the earlier week had nothing
  // to compare against; undefined (no badge) without two full weeks of data.
  const weekDelta = (pick: (d: (typeof daily)[number]) => number) => {
    if (daily.length < 14) return undefined;
    const sum = (xs: typeof daily) => xs.reduce((n, x) => n + pick(x), 0);
    const recent = sum(daily.slice(7));
    const before = sum(daily.slice(0, 7));
    return before === 0 ? null : Math.round(((recent - before) / before) * 100);
  };
  const rateOf = (xs: typeof daily) => {
    const v = xs.reduce((n, x) => n + x.views, 0);
    return v ? xs.reduce((n, x) => n + x.responses, 0) / v : 0;
  };
  const rateDelta = (() => {
    if (daily.length < 14) return undefined;
    const before = rateOf(daily.slice(0, 7));
    return before === 0 ? null : Math.round(((rateOf(daily.slice(7)) - before) / before) * 100);
  })();
  const topDrop = analytics?.partialsEnabled ? analytics.dropOff[0] : undefined;
  const dropOffLabel = topDrop
    ? valueFields(fields).find((f) => f.id === topDrop.fieldId)?.label ?? 'Deleted question'
    : '—';
  const topSource = analytics?.sources[0];
  const sourceTotal = analytics?.sources.reduce((sum, s) => sum + s.count, 0) ?? 0;

  const items: StatItem[] = analytics
    ? [
        {
          key: 'views',
          icon: <EyeIcon size={14} />,
          label: 'Views',
          value: analytics.viewCount.toLocaleString(),
          delta: weekDelta((d) => d.views),
          caption: 'All time',
        },
        {
          key: 'responses',
          icon: <InboxIcon size={14} />,
          label: 'Responses',
          value: analytics.submissionCount.toLocaleString(),
          delta: weekDelta((d) => d.responses),
          caption: 'All time',
        },
        {
          key: 'completion',
          icon: <TrendingUpIcon size={14} />,
          label: 'Completion',
          value: `${Math.min(100, Math.round(analytics.completionRate * 100))}%`,
          delta: rateDelta,
          caption: 'Responses per view',
        },
        {
          key: 'source',
          icon: <GlobeIcon size={14} />,
          label: 'Top source',
          value: topSource?.source ?? '—',
          caption: topSource
            ? `${Math.round((topSource.count / sourceTotal) * 100)}% of responses`
            : 'No responses yet',
          onClick: () => setSourcesOpen(true),
        },
        {
          key: 'dropoff',
          icon: <UserXIcon size={14} />,
          label: 'Most gave up at',
          value: dropOffLabel,
          caption: !analytics.partialsEnabled
            ? 'Turn on partial saves to track'
            : topDrop
              ? `${topDrop.abandoned.toLocaleString()} left here`
              : 'Nobody has given up yet',
          onClick: () => setDropOffOpen(true),
        },
      ]
    : [];

  return (
    <>
      <StatStrip items={items} loading={!analytics} />

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

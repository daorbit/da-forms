import { useState } from 'react';
import { Text, Group, Stack, Progress, Modal, SimpleGrid } from '@mantine/core';
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
import { StatCard, StatCardSkeleton } from '@/components/ui/StatCard';

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
  const series = (pick: (d: (typeof daily)[number]) => number) => daily.map((d) => ({ v: pick(d) }));

  const dropOffLabel =
    analytics && analytics.partialsEnabled && analytics.dropOff.length > 0
      ? valueFields(fields).find((f) => f.id === analytics.dropOff[0].fieldId)?.label ?? 'Deleted question'
      : analytics && !analytics.partialsEnabled
        ? 'Not tracked'
        : '—';

  return (
    <>
      {!analytics ? (
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} spacing="lg">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} spacing="lg">
          <StatCard
            icon={<IconEye size={14} />}
            label="Views"
            value={analytics.viewCount.toLocaleString()}
            hint="Times the form was opened. Repeat opens by the same visitor within 30 minutes count once."
            color="#22d3ee"
            delta={weekDelta((d) => d.views)}
            spark={series((d) => d.views)}
          />
          <StatCard
            icon={<IconInbox size={14} />}
            label="Responses"
            value={analytics.submissionCount.toLocaleString()}
            hint="Complete submissions. The change compares the last 7 days with the 7 before."
            delta={weekDelta((d) => d.responses)}
            spark={series((d) => d.responses)}
          />
          <StatCard
            icon={<IconTrendingUp size={14} />}
            label="Completion"
            value={`${Math.round(analytics.completionRate * 100)}%`}
            hint="Responses divided by views. The change compares this week's rate with last week's."
            color="#f59e0b"
            delta={rateDelta}
            spark={series((d) => (d.views ? d.responses / d.views : 0))}
          />
          <StatCard
            icon={<IconWorld size={14} />}
            label="Top source"
            value={analytics.sources[0]?.source ?? '—'}
            color="#34d399"
            spark={series((d) => d.topSource)}
            onClick={() => setSourcesOpen(true)}
          />
          <StatCard
            icon={<IconUserOff size={14} />}
            label="Gave up at"
            value={dropOffLabel}
            color="#f472b6"
            spark={analytics.partialsEnabled ? series((d) => d.abandoned) : undefined}
            onClick={() => setDropOffOpen(true)}
          />
        </SimpleGrid>
      )}

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

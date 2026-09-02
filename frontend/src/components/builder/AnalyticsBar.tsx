import { useState } from 'react';
import { SimpleGrid, Box, Text, Group, Stack, Progress, Modal, UnstyledButton } from '@mantine/core';
import {
  IconEye,
  IconInbox,
  IconTrendingUp,
  IconWorld,
  IconChevronRight,
  IconUserOff,
} from '@tabler/icons-react';
import type { Analytics } from '@/lib/api';
import type { FormField } from '@/types';
import { valueFields } from '@/lib/fieldTree';
import { StatTile, StatTileSkeleton, decorativeSpark } from './StatTile';
import classes from './StatTile.module.css';

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
            color="cyan"
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
            color="orange"
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

  if (!analytics) {
    return (
      <SimpleGrid cols={{ base: 1, sm: 5 }} spacing="md" px="md" py="md">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatTileSkeleton key={i} />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <>
      <SimpleGrid cols={{ base: 1, sm: 5 }} spacing="md" px="md" py="md">
        <StatTile
          icon={IconEye}
          label="Views"
          value={analytics.viewCount.toLocaleString()}
          accent="#22d3ee"
          spark={decorativeSpark(analytics.viewCount)}
        />
        <StatTile
          icon={IconInbox}
          label="Submissions"
          value={analytics.submissionCount.toLocaleString()}
          accent="#34d399"
          spark={decorativeSpark(analytics.submissionCount)}
        />
        <StatTile
          icon={IconTrendingUp}
          label="Completion rate"
          value={`${Math.round(analytics.completionRate * 100)}%`}
          accent="#c084fc"
          spark={decorativeSpark(Math.round(analytics.completionRate * 100))}
        />
        <UnstyledButton className={classes.cardButton} onClick={() => setSourcesOpen(true)}>
          <Box className={classes.card}>
            <Box px="md" pt="md">
              <Group justify="space-between" align="flex-start" wrap="nowrap" mb={6}>
                <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                  <IconWorld size={14} className={classes.icon} />
                  <Text size="xs" c="dimmed" fw={500} truncate className={classes.label}>
                    Traffic sources
                  </Text>
                </Group>
                <IconChevronRight size={16} className={classes.icon} />
              </Group>
              <Text className={classes.value} truncate>
                {analytics.sources[0]?.source ?? '—'}
              </Text>
            </Box>
            {/* Empty, but the same reserved track as every other tile — without
                it this card is 26px shorter than the three beside it. */}
            <div className={classes.spark} />
          </Box>
        </UnstyledButton>

        <UnstyledButton className={classes.cardButton} onClick={() => setDropOffOpen(true)}>
          <Box className={classes.card}>
            <Box px="md" pt="md">
              <Group justify="space-between" align="flex-start" wrap="nowrap" mb={6}>
                <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                  <IconUserOff size={14} className={classes.icon} />
                  <Text size="xs" c="dimmed" fw={500} truncate className={classes.label}>
                    Gave up at
                  </Text>
                </Group>
                <IconChevronRight size={16} className={classes.icon} />
              </Group>
              <Text className={classes.value} truncate>
                {/* An em dash for both "not tracking" and "nobody quit" — the
                    modal is where that distinction is worth the words. */}
                {analytics.partialsEnabled && analytics.dropOff.length > 0
                  ? (fields.length
                      ? valueFields(fields).find((f) => f.id === analytics.dropOff[0].fieldId)?.label
                      : undefined) ?? 'Deleted question'
                  : '—'}
              </Text>
            </Box>
            <div className={classes.spark} />
          </Box>
        </UnstyledButton>
      </SimpleGrid>

      <Modal
        opened={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        title="Traffic sources"
        centered
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.65, blur: 2 }}
      >
        <SourceBreakdown sources={analytics.sources} />
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
          dropOff={analytics.dropOff}
          fields={fields}
          enabled={analytics.partialsEnabled}
        />
      </Modal>
    </>
  );
}

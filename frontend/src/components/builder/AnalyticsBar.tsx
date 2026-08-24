import { useState } from 'react';
import { SimpleGrid, Box, Text, Group, Stack, Progress, Modal, UnstyledButton, Skeleton } from '@mantine/core';
import { IconEye, IconInbox, IconTrendingUp, IconWorld, IconChevronRight } from '@tabler/icons-react';
import type { Analytics } from '@/lib/api';
import classes from './AnalyticsBar.module.css';

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IconEye;
  label: string;
  value: string;
}) {
  return (
    <Box className={classes.card} p="lg">
      {/* Label first: the icon just marks what kind of number this is,
          it doesn't need its own tinted badge to be legible. */}
      <Group gap={6} wrap="nowrap" mb="sm">
        <Icon size={14} style={{ color: 'var(--mantine-color-dimmed)', flexShrink: 0 }} />
        <Text size="xs" c="dimmed" fw={500} truncate style={{ letterSpacing: '0.01em' }}>
          {label}
        </Text>
      </Group>
      <Text className={classes.value}>{value}</Text>
    </Box>
  );
}

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

function StatSkeleton() {
  return (
    <Box className={classes.card} p="lg">
      <Stack gap={8}>
        <Skeleton height={10} width={70} />
        <Skeleton height={26} width={60} />
      </Stack>
    </Box>
  );
}

export function AnalyticsBar({ analytics }: { analytics: Analytics | null }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);

  if (!analytics) {
    return (
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md" px="md" py="md">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <>
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md" px="md" py="md">
        <Stat icon={IconEye} label="Views" value={analytics.viewCount.toLocaleString()} />
        <Stat icon={IconInbox} label="Submissions" value={analytics.submissionCount.toLocaleString()} />
        <Stat icon={IconTrendingUp} label="Completion rate" value={`${Math.round(analytics.completionRate * 100)}%`} />
        <UnstyledButton className={classes.cardButton} onClick={() => setSourcesOpen(true)}>
          <Box className={classes.card} p="lg">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <div style={{ minWidth: 0 }}>
                <Group gap={6} wrap="nowrap" mb="sm">
                  <IconWorld size={14} style={{ color: 'var(--mantine-color-dimmed)', flexShrink: 0 }} />
                  <Text size="xs" c="dimmed" fw={500} truncate style={{ letterSpacing: '0.01em' }}>
                    Traffic sources
                  </Text>
                </Group>
                <Text className={classes.value} truncate>
                  {analytics.sources[0]?.source ?? '—'}
                </Text>
              </div>
              <IconChevronRight size={16} style={{ color: 'var(--mantine-color-dimmed)', flexShrink: 0, marginTop: 6 }} />
            </Group>
          </Box>
        </UnstyledButton>
      </SimpleGrid>

      <Modal
        opened={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        title="Traffic sources"
        centered
        overlayProps={{ backgroundOpacity: 0.65, blur: 2 }}
      >
        <SourceBreakdown sources={analytics.sources} />
      </Modal>
    </>
  );
}

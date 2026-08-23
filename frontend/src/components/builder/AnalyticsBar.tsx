import { useState } from 'react';
import { SimpleGrid, Paper, Text, Group, ThemeIcon, Stack, Progress, Modal, UnstyledButton } from '@mantine/core';
import { IconEye, IconInbox, IconTrendingUp, IconWorld, IconChevronRight } from '@tabler/icons-react';
import type { Analytics } from '@/lib/api';

function Stat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof IconEye;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Paper withBorder radius="lg" p="lg">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: 0.4 }}>
            {label}
          </Text>
          <Text size="28px" fw={800} mt={4} style={{ lineHeight: 1 }}>
            {value}
          </Text>
        </div>
        <ThemeIcon variant="light" color={color} size={40} radius="md">
          <Icon size={20} stroke={1.8} />
        </ThemeIcon>
      </Group>
    </Paper>
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
          <Progress value={(count / total) * 100} size="sm" color="cyan" />
        </div>
      ))}
    </Stack>
  );
}

export function AnalyticsBar({ analytics }: { analytics: Analytics | null }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  if (!analytics) return null;

  return (
    <>
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md" px="md" py="md">
        <Stat icon={IconEye} label="Views" value={analytics.viewCount.toLocaleString()} color="blue" />
        <Stat
          icon={IconInbox}
          label="Submissions"
          value={analytics.submissionCount.toLocaleString()}
          color="emerald"
        />
        <Stat
          icon={IconTrendingUp}
          label="Completion rate"
          value={`${Math.round(analytics.completionRate * 100)}%`}
          color="grape"
        />
        <UnstyledButton onClick={() => setSourcesOpen(true)}>
          <Paper withBorder radius="lg" p="lg">
            <Group justify="space-between" align="center" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon variant="light" color="cyan" size={40} radius="md">
                  <IconWorld size={20} stroke={1.8} />
                </ThemeIcon>
                <Text size="sm" fw={600}>
                  Traffic sources
                </Text>
              </Group>
              <IconChevronRight size={16} color="var(--mantine-color-gray-6)" />
            </Group>
          </Paper>
        </UnstyledButton>
      </SimpleGrid>

      <Modal opened={sourcesOpen} onClose={() => setSourcesOpen(false)} title="Traffic sources" centered>
        <SourceBreakdown sources={analytics.sources} />
      </Modal>
    </>
  );
}

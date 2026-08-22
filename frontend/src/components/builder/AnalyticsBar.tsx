import { SimpleGrid, Paper, Text, Group, ThemeIcon } from '@mantine/core';
import { IconEye, IconInbox, IconTrendingUp } from '@tabler/icons-react';
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
    <Paper withBorder radius="md" p="md">
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon variant="light" color={color} size={38} radius="md">
          <Icon size={20} />
        </ThemeIcon>
        <div>
          <Text size="xs" c="dimmed">
            {label}
          </Text>
          <Text size="lg" fw={700}>
            {value}
          </Text>
        </div>
      </Group>
    </Paper>
  );
}

export function AnalyticsBar({ analytics }: { analytics: Analytics | null }) {
  if (!analytics) return null;

  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" px="md" py="sm">
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
    </SimpleGrid>
  );
}

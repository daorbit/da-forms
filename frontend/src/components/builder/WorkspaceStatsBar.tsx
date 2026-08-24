import { SimpleGrid, Box, Text, Group, Skeleton, Stack } from '@mantine/core';
import { IconFiles, IconWorldUpload, IconFilePencil, IconInbox } from '@tabler/icons-react';
import type { WorkspaceStats } from '@/lib/api';
import classes from './WorkspaceStatsBar.module.css';

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IconFiles;
  label: string;
  value: string;
}) {
  return (
    <Box className={classes.card} p="lg">
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

export function WorkspaceStatsBar({ stats }: { stats: WorkspaceStats | null }) {
  if (!stats) {
    return (
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" px="xl" pt="lg" pb="lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" px="xl" pt="lg" pb="lg">
      <Stat icon={IconFiles} label="Total forms" value={stats.totalForms.toLocaleString()} />
      <Stat icon={IconWorldUpload} label="Live forms" value={stats.publishedForms.toLocaleString()} />
      <Stat icon={IconFilePencil} label="Drafts" value={stats.draftForms.toLocaleString()} />
      <Stat icon={IconInbox} label="Total submissions" value={stats.totalSubmissions.toLocaleString()} />
    </SimpleGrid>
  );
}

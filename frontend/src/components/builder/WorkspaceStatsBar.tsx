import { SimpleGrid, Paper, Text, Group, ThemeIcon, Skeleton, Stack } from '@mantine/core';
import { IconFiles, IconWorldUpload, IconFilePencil, IconInbox } from '@tabler/icons-react';
import type { WorkspaceStats } from '@/lib/api';

function Stat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof IconFiles;
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

function StatSkeleton() {
  return (
    <Paper withBorder radius="lg" p="lg">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={8}>
          <Skeleton height={10} width={70} />
          <Skeleton height={22} width={50} />
        </Stack>
        <Skeleton height={40} width={40} radius="md" />
      </Group>
    </Paper>
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
      <Stat icon={IconFiles} label="Total forms" value={stats.totalForms.toLocaleString()} color="gray" />
      <Stat
        icon={IconWorldUpload}
        label="Live forms"
        value={stats.publishedForms.toLocaleString()}
        color="emerald"
      />
      <Stat icon={IconFilePencil} label="Drafts" value={stats.draftForms.toLocaleString()} color="orange" />
      <Stat
        icon={IconInbox}
        label="Total submissions"
        value={stats.totalSubmissions.toLocaleString()}
        color="blue"
      />
    </SimpleGrid>
  );
}

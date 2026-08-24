import { SimpleGrid } from '@mantine/core';
import { IconFiles, IconWorldUpload, IconFilePencil, IconInbox } from '@tabler/icons-react';
import type { WorkspaceStats } from '@/lib/api';
import { StatTile, StatTileSkeleton, decorativeSpark } from './StatTile';

export function WorkspaceStatsBar({ stats }: { stats: WorkspaceStats | null }) {
  if (!stats) {
    return (
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" px="xl" pt="lg" pb="lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatTileSkeleton key={i} />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" px="xl" pt="lg" pb="lg">
      <StatTile
        icon={IconFiles}
        label="Total forms"
        value={stats.totalForms.toLocaleString()}
        accent="#a78bfa"
        spark={decorativeSpark(stats.totalForms)}
      />
      <StatTile
        icon={IconWorldUpload}
        label="Live forms"
        value={stats.publishedForms.toLocaleString()}
        accent="#34d399"
        spark={decorativeSpark(stats.publishedForms)}
      />
      <StatTile
        icon={IconFilePencil}
        label="Drafts"
        value={stats.draftForms.toLocaleString()}
        accent="#f59e0b"
        spark={decorativeSpark(stats.draftForms)}
      />
      <StatTile
        icon={IconInbox}
        label="Total submissions"
        value={stats.totalSubmissions.toLocaleString()}
        accent="#22d3ee"
        spark={decorativeSpark(stats.totalSubmissions)}
      />
    </SimpleGrid>
  );
}

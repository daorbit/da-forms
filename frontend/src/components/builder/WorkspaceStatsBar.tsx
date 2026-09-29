import { SimpleGrid } from '@mantine/core';
import { CloudUploadIcon, FilePenIcon, FilesIcon, InboxIcon } from 'lucide-react';
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
        icon={FilesIcon}
        label="Total forms"
        value={stats.totalForms.toLocaleString()}
        accent="#a78bfa"
        spark={decorativeSpark(stats.totalForms)}
      />
      <StatTile
        icon={CloudUploadIcon}
        label="Live forms"
        value={stats.publishedForms.toLocaleString()}
        accent="var(--accent)"
        spark={decorativeSpark(stats.publishedForms)}
      />
      <StatTile
        icon={FilePenIcon}
        label="Drafts"
        value={stats.draftForms.toLocaleString()}
        accent="#f59e0b"
        spark={decorativeSpark(stats.draftForms)}
      />
      <StatTile
        icon={InboxIcon}
        label="Total submissions"
        value={stats.totalSubmissions.toLocaleString()}
        accent="#22d3ee"
        spark={decorativeSpark(stats.totalSubmissions)}
      />
    </SimpleGrid>
  );
}

import { useMemo } from 'react';
import { SimpleGrid, Box, Text, Skeleton, Stack } from '@mantine/core';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { WorkspaceStats } from '@/lib/api';
import classes from './WorkspaceStatsBar.module.css';

 
function decorativeSpark(seed: number) {
  const points = 8;
 
  const phase = (seed % 10) * 0.3;
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const wave = Math.sin(t * Math.PI * 1.5 + phase) * 0.12;
    return { v: 0.3 + t * 0.4 + wave };
  });
}

function Stat({
  label,
  value,
  accent,
  spark,
}: {
  label: string;
  value: string;
  accent: string;
  spark: { v: number }[];
}) {
  const sparkId = useMemo(() => `wstat-spark-${label.replace(/\W/g, '')}`, [label]);
  return (
    <Box className={classes.card} p="lg" h="100%">
      <Text size="xs" c="dimmed" fw={500} truncate mb="sm" style={{ letterSpacing: '0.01em' }}>
        {label}
      </Text>
      <Text className={classes.value}>{value}</Text>

      <div style={{ height: 40, marginTop: 10 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
            <defs>
              <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.22} />
                <stop offset="100%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={accent}
              strokeWidth={2}
              fill={`url(#${sparkId})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Box>
  );
}

function StatSkeleton() {
  return (
    <Box className={classes.card} p="lg">
      <Stack gap={8}>
        <Skeleton height={10} width={70} />
        <Skeleton height={26} width={60} />
        <Skeleton height={40} mt={10} radius="sm" />
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
      <Stat
        label="Total forms"
        value={stats.totalForms.toLocaleString()}
        accent="#a78bfa"
        spark={decorativeSpark(stats.totalForms)}
      />
      <Stat
        label="Live forms"
        value={stats.publishedForms.toLocaleString()}
        accent="#34d399"
        spark={decorativeSpark(stats.publishedForms)}
      />
      <Stat
        label="Drafts"
        value={stats.draftForms.toLocaleString()}
        accent="#f59e0b"
        spark={decorativeSpark(stats.draftForms)}
      />
      <Stat
        label="Total submissions"
        value={stats.totalSubmissions.toLocaleString()}
        accent="#22d3ee"
        spark={decorativeSpark(stats.totalSubmissions)}
      />
    </SimpleGrid>
  );
}

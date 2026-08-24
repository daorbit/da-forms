import { useState, useMemo } from 'react';
import { SimpleGrid, Box, Text, Group, Stack, Progress, Modal, UnstyledButton, Skeleton } from '@mantine/core';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { IconChevronRight } from '@tabler/icons-react';
import type { Analytics } from '@/lib/api';
import classes from './AnalyticsBar.module.css';

 
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
  accent?: string;
  spark?: { v: number }[];
}) {
  const sparkId = useMemo(() => `spark-${label.replace(/\W/g, '')}`, [label]);
  return (
    <Box className={classes.card} h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Box px="lg" pt="lg">
        <Text size="xs" c="dimmed" fw={500} truncate mb="sm" style={{ letterSpacing: '0.01em' }}>
          {label}
        </Text>
        <Text className={classes.value}>{value}</Text>
      </Box>

      {/* Fixed height reserved on every card, spark or not, so a row of
          mixed metrics stays the same height instead of some cards being
          taller than others. A little side/bottom padding so the line
          doesn't run into the card's rounded corners. */}
      <div style={{ height: 40, margin: '10px 6px 8px', flex: '0 0 auto' }}>
        {spark && (
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
        )}
      </div>
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
        <Stat
          label="Views"
          value={analytics.viewCount.toLocaleString()}
          accent="#22d3ee"
          spark={decorativeSpark(analytics.viewCount)}
        />
        <Stat
          label="Submissions"
          value={analytics.submissionCount.toLocaleString()}
          accent="#34d399"
          spark={decorativeSpark(analytics.submissionCount)}
        />
        <Stat
          label="Completion rate"
          value={`${Math.round(analytics.completionRate * 100)}%`}
          accent="#c084fc"
          spark={decorativeSpark(Math.round(analytics.completionRate * 100))}
        />
        <UnstyledButton className={classes.cardButton} onClick={() => setSourcesOpen(true)} h="100%">
          <Box className={classes.card} h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
            <Box px="lg" pt="lg">
              <Group justify="space-between" align="flex-start" wrap="nowrap" mb="sm">
                <Text size="xs" c="dimmed" fw={500} truncate style={{ letterSpacing: '0.01em', minWidth: 0 }}>
                  Traffic sources
                </Text>
                <IconChevronRight size={16} style={{ color: 'var(--mantine-color-dimmed)', flexShrink: 0 }} />
              </Group>
              <Text className={classes.value} truncate>
                {analytics.sources[0]?.source ?? '—'}
              </Text>
            </Box>
            <div style={{ height: 40, margin: '10px 6px 8px' }} />
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

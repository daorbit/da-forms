import { useMemo } from 'react';
import { Box, Text, Group, Stack, Skeleton } from '@mantine/core';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import type { Icon as TablerIcon } from '@tabler/icons-react';
import classes from './StatTile.module.css';

 
/**
 * A decorative curve for a stat tile.
 *
 * Not real history — it is a shape derived from the value so the tile has some
 * movement in it. Returns null at zero on purpose: a flat line across an empty
 * tile reads as a broken chart rather than as "nothing here yet", and four of
 * them side by side on a new workspace read as a broken page.
 */
export function decorativeSpark(seed: number) {
  if (!seed) return null;

  const points = 8;
  const phase = (seed % 10) * 0.3;

  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const wave = Math.sin(t * Math.PI + phase) * 0.05;
    return { v: 0.5 + wave };
  });
}

export function StatTile({
  icon: Icon,
  label,
  value,
  accent,
  spark,
}: {
  icon: TablerIcon;
  label: string;
  value: string;
  accent?: string;
  /** Null when there is nothing to draw — see `decorativeSpark`. */
  spark?: { v: number }[] | null;
}) {
  const sparkId = useMemo(() => `spark-${label.replace(/\W/g, '')}`, [label]);

  return (
    <Box className={classes.card}>
      <Box px="md" pt="md">
        <Group gap={6} wrap="nowrap" mb={6}>
          <Icon size={14} className={classes.icon} />
          <Text size="xs" c="dimmed" fw={500} truncate className={classes.label}>
            {label}
          </Text>
        </Group>
        <Text className={classes.value}>{value}</Text>
      </Box>

      {/* Reserved whether or not a curve is drawn, so a tile at zero is the
          same height as its neighbours. `overflow: hidden` on the track is what
          keeps the stroke from escaping the card's bottom edge. */}
      <div className={classes.spark}>
        {spark && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <YAxis domain={[0, 1]} hide />
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

/** Matches the loaded tile's metrics, so nothing shifts when the data lands. */
export function StatTileSkeleton() {
  return (
    <Box className={classes.card}>
      <Box px="md" pt="md">
        <Stack gap={10}>
          <Skeleton height={10} width={70} />
          <Skeleton height={28} width={64} />
        </Stack>
      </Box>
      <div className={classes.spark} />
    </Box>
  );
}

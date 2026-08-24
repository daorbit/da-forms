import { useMemo } from 'react';
import { Box, Text, Group, Stack, Skeleton } from '@mantine/core';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import type { Icon as TablerIcon } from '@tabler/icons-react';
import classes from './StatTile.module.css';

 
export function decorativeSpark(seed: number) {
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
  spark?: { v: number }[];
}) {
  const sparkId = useMemo(() => `spark-${label.replace(/\W/g, '')}`, [label]);
  return (
    <Box className={classes.card} h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Box px="md" pt="md">
        <Group gap={6} wrap="nowrap" mb={6}>
          <Icon size={14} style={{ color: 'var(--mantine-color-dimmed)', flexShrink: 0 }} />
          <Text size="xs" c="dimmed" fw={500} truncate style={{ letterSpacing: '0.01em' }}>
            {label}
          </Text>
        </Group>
        <Text style={{fontSize: '30px',fontWeight: '700'}} className={classes.value}>
          {value}
        </Text>
      </Box>

      <div style={{ height: 26, marginTop: 6, flex: '0 0 auto' }}>
        {spark && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
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

export function StatTileSkeleton() {
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

import type { ReactNode } from 'react';
import { Box, Group, Skeleton, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { IconChevronRight, IconInfoCircle, IconMinus, IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import classes from './StatCard.module.css';

/**
 * Quantalog's analytics stat card, copied so the responses page reads like the
 * host app's Analytics page: the label first with a small icon, a change badge
 * on the right, the number large, and a trend drawn along the foot — only when
 * there is a real series to draw.
 */
export function StatCard({
  icon,
  label,
  value,
  hint,
  delta,
  spark,
  color = 'var(--mantine-primary-color-filled)',
  inverseDelta,
  onClick,
}: {
  /** The trend's colour — each card keeps its own, as on Quantalog's Analytics. */
  color?: string;
  /** True when a rise is bad (people giving up), which flips the badge colour. */
  inverseDelta?: boolean;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  /** Plain-language note on what the number means, behind an info icon. */
  hint?: string;
  /** % change against the previous equal period; null shows a dash. */
  delta?: number | null;
  spark?: { v: number }[];
  /** Opens more detail; a chevron takes the badge's place. */
  onClick?: () => void;
}) {
  const hasSpark = !!spark && spark.length > 1 && spark.some((p) => p.v > 0);
  const id = `spark-${label.replace(/\W/g, '')}`;

  const card = (
    <Box className={classes.card} data-clickable={onClick ? true : undefined}>
      <Box className={classes.body} data-spark={hasSpark || undefined}>
        <Group justify="space-between" align="center" wrap="nowrap" mb="sm">
          <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
            <span className={classes.icon}>{icon}</span>
            <Text size="xs" c="dimmed" fw={500} truncate style={{ letterSpacing: '0.01em' }}>
              {label}
            </Text>
            {hint && (
              <Tooltip label={hint} multiline w={240} withArrow>
                <IconInfoCircle size={12} className={classes.icon} style={{ cursor: 'help' }} />
              </Tooltip>
            )}
          </Group>
          {onClick ? (
            <IconChevronRight size={15} className={classes.icon} />
          ) : delta !== undefined ? (
            <Delta delta={delta} inverse={inverseDelta} />
          ) : null}
        </Group>
        <div className={classes.value}>{value}</div>
      </Box>

      {hasSpark && (
        <div className={classes.spark}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${id})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Box>
  );

  return onClick ? (
    <UnstyledButton onClick={onClick} className={classes.button}>
      {card}
    </UnstyledButton>
  ) : (
    card
  );
}

function Delta({ delta, inverse }: { delta: number | null; inverse?: boolean }) {
  if (delta === null) {
    return (
      <Text size="xs" c="dimmed" fw={500}>
        —
      </Text>
    );
  }
  const Icon = delta === 0 ? IconMinus : delta > 0 ? IconTrendingUp : IconTrendingDown;
  return (
    <span
      className={classes.delta}
      data-dir={delta === 0 ? 'flat' : (delta > 0) !== !!inverse ? 'good' : 'bad'}
    >
      <Icon size={11} />
      {delta > 0 ? '+' : ''}
      {delta}%
    </span>
  );
}

export function StatCardSkeleton() {
  return (
    <Box className={classes.card}>
      <Box className={classes.body}>
        <Skeleton height={10} width={80} mb="md" />
        <Skeleton height={28} width={70} />
      </Box>
    </Box>
  );
}

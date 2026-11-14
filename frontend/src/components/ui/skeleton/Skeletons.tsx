import type { ReactNode } from 'react';
import { Box, Group, Skeleton } from '@mantine/core';
import classes from './Skeletons.module.css';

const LABEL_WIDTHS = ['62%', '48%', '70%', '40%', '56%', '44%', '52%', '36%'];

const WAVE_LINE = 'M0 34 C 12 30, 20 22, 32 24 S 52 32, 64 26 S 84 12, 96 16 S 116 26, 128 18 S 148 8, 160 12 L 200 6';
const WAVE_FILL = `${WAVE_LINE} L 200 48 L 0 48 Z`;

const PANEL_CHROME = 104;
const PANEL_ROW = 48;
const PANEL_MAX_ROWS = 10;

function SkeletonWave({ className }: { className?: string }) {
  return (
    <svg className={`${classes.wave} ${className ?? ''}`} viewBox="0 0 200 48" preserveAspectRatio="none" aria-hidden>
      <path d={WAVE_FILL} className={classes.waveFill} />
      <path d={WAVE_LINE} className={classes.waveLine} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function SkeletonCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`${classes.card} ${className ?? ''}`}>{children}</div>;
}

export function StatCardSkeleton({ spark = true }: { spark?: boolean }) {
  return (
    <div className={classes.stat}>
      <div className={classes.statBody}>
        <div className={classes.statHead}>
          <Group gap={8} wrap="nowrap">
            <Skeleton height={16} width={16} radius={5} />
            <Skeleton height={10} width={70} radius="sm" />
          </Group>
          <Skeleton height={10} width={44} radius="sm" />
        </div>
        <Skeleton height={30} width="46%" mt={18} radius={8} />
        <Skeleton height={9} width="58%" mt={10} radius="sm" />
      </div>
      {spark && (
        <div className={classes.statSpark}>
          <SkeletonWave />
        </div>
      )}
    </div>
  );
}

export function SkeletonCardHead({ actions = 0 }: { actions?: number }) {
  return (
    <div className={classes.head}>
      <div className={classes.headText}>
        <Skeleton height={12} width={120} radius="sm" />
        <Skeleton height={9} width={170} radius="sm" />
      </div>
      {actions > 0 && (
        <Group gap={8} wrap="nowrap">
          {Array.from({ length: actions }).map((_, i) => (
            <Skeleton key={i} height={28} width={i === 0 ? 150 : 84} radius={8} />
          ))}
        </Group>
      )}
    </div>
  );
}

export function SkeletonRows({ rows = 5, aside = true }: { rows?: number; aside?: boolean }) {
  return (
    <>
      <div className={classes.columns}>
        <Skeleton height={8} width={46} radius="sm" />
        <div className={classes.columnsEnd}>
          <Skeleton height={8} width={40} radius="sm" />
          {aside && <Skeleton height={8} width={40} radius="sm" />}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={classes.row}>
          <div className={classes.rowMain}>
            <Skeleton height={10} width={LABEL_WIDTHS[i % LABEL_WIDTHS.length]} radius="sm" />
            <Skeleton height={4} width={`${92 - i * 12}%`} radius="xl" />
          </div>
          <Skeleton height={10} width={38} radius="sm" />
          {aside && <Skeleton height={10} width={34} radius="sm" />}
        </div>
      ))}
    </>
  );
}

export function ListSkeleton({ rows = 5, aside = true }: { rows?: number; aside?: boolean }) {
  return (
    <SkeletonCard>
      <SkeletonCardHead />
      <SkeletonRows rows={rows} aside={aside} />
    </SkeletonCard>
  );
}

export function ChartSkeleton({ height = 220, actions = 2 }: { height?: number; actions?: number }) {
  return (
    <SkeletonCard>
      <SkeletonCardHead actions={actions} />
      <div className={classes.chartLegend}>
        <Skeleton height={8} width={78} radius="sm" />
        <Skeleton height={8} width={92} radius="sm" />
      </div>
      <Box h={height} className={classes.chartArea}>
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className={classes.gridLine} />
        ))}
        <SkeletonWave className={classes.chartWave} />
      </Box>
      <div className={classes.chartTicks}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={8} width={34} radius="sm" />
        ))}
      </div>
    </SkeletonCard>
  );
}

export function PanelSkeleton({ height }: { height: number }) {
  const rows = Math.min(PANEL_MAX_ROWS, Math.floor((height - PANEL_CHROME) / PANEL_ROW));
  return (
    <Box className={classes.card} mih={height} aria-hidden>
      {rows > 0 ? (
        <>
          <SkeletonCardHead />
          <SkeletonRows rows={rows} aside={false} />
        </>
      ) : (
        <div className={classes.compact}>
          <div className={classes.headText}>
            <Skeleton height={12} width={160} radius="sm" />
            <Skeleton height={9} width={240} maw="100%" radius="sm" />
          </div>
          <Skeleton height={28} width={84} radius={8} />
        </div>
      )}
    </Box>
  );
}

export function TableRowsSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  const cells = Array.from({ length: columns - 1 });
  return (
    <div className={classes.table} aria-hidden>
      <div className={classes.tableRow} data-head>
        <Skeleton height={8} width={70} radius="sm" />
        {cells.map((_, i) => (
          <span key={i} className={classes.tableCell}>
            <Skeleton height={8} width={48} radius="sm" />
          </span>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={classes.tableRow}>
          <Skeleton height={10} width={LABEL_WIDTHS[r % LABEL_WIDTHS.length]} radius="sm" />
          {cells.map((_, i) => (
            <span key={i} className={classes.tableCell}>
              <Skeleton height={10} width={56 - i * 6} radius="sm" />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function FieldCardSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <SkeletonCard className={classes.field}>
      <Skeleton height={11} width={wide ? 180 : 130} radius="sm" />
      <Skeleton height={wide ? 72 : 38} mt={12} radius={10} />
    </SkeletonCard>
  );
}

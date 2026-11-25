import { Skeleton } from '@mantine/core';
import type { BrickRow } from '@/lib/brickRows';
import classes from './Bricks.module.css';

const BRICK_RADIUS = 12;

type BrickProps = {
  height: number | string;
  width?: number | string;
  className?: string;
};

export function Brick({ height, width, className }: BrickProps) {
  return <Skeleton height={height} width={width} maw="100%" radius={BRICK_RADIUS} className={className} aria-hidden />;
}

export function Bricks({ rows, label = 'Loading' }: { rows: BrickRow[]; label?: string }) {
  return (
    <div className={classes.wall} role="status" aria-busy aria-label={label}>
      {rows.map(({ height, cols = 1, split }, i) => (
        <div key={i} className={classes.row} data-cols={split ? undefined : cols} data-split={split}>
          {Array.from({ length: split ? 2 : cols }, (_, brick) => (
            <Brick key={brick} height={height} />
          ))}
        </div>
      ))}
    </div>
  );
}

import type { LucideIcon } from 'lucide-react';
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { AreaSpark } from './AreaSpark';
import classes from './StatTile.module.css';

export type StatTone = 'blue' | 'orange' | 'purple' | 'green';

export interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: StatTone;
  delta?: number | null;
  subline?: string;
  money?: boolean;
  points?: { label: string; value: number }[];
  format?: (value: number) => string;
}

function Delta({ value }: { value: number }) {
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const Icon = dir === 'up' ? TrendingUpIcon : dir === 'down' ? TrendingDownIcon : MinusIcon;
  return (
    <span className={classes.delta} data-dir={dir}>
      <Icon size={13} strokeWidth={2.4} />
      {value > 0 ? '+' : ''}
      {value}%
    </span>
  );
}

export function StatTile({ icon: Icon, label, value, tone, delta, subline, money, points, format = String }: StatTileProps) {
  const hasSpark = Boolean(points && points.length > 1);
  return (
    <div className={classes.tile} data-tone={tone}>
      <div className={classes.body}>
        <div className={classes.head}>
          <Icon size={16} className={classes.icon} />
          <span className={classes.label}>{label}</span>
          <span className={classes.spacer} />
          {delta !== undefined && delta !== null && <Delta value={delta} />}
        </div>
        <div className={classes.value} data-money={money || undefined}>
          {value}
        </div>
        {subline && <span className={classes.subline}>{subline}</span>}
      </div>
      {hasSpark && points && <AreaSpark points={points} format={format} />}
    </div>
  );
}

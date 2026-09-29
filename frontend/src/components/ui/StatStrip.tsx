import type { ReactNode } from 'react';
import { Skeleton, UnstyledButton } from '@mantine/core';
import { ChevronRightIcon, MinusIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import classes from './StatStrip.module.css';

export interface StatItem {
  key: string;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  delta?: number | null;
  inverseDelta?: boolean;
  onClick?: () => void;
}

function Delta({ delta, inverse }: { delta: number | null; inverse?: boolean }) {
  if (delta === null) return <span className={classes.caption}>No earlier week to compare</span>;
  const Icon = delta === 0 ? MinusIcon : delta > 0 ? TrendingUpIcon : TrendingDownIcon;
  const dir = delta === 0 ? 'flat' : (delta > 0) !== !!inverse ? 'good' : 'bad';
  return (
    <span className={classes.delta} data-dir={dir}>
      <Icon size={12} />
      {delta > 0 ? '+' : ''}
      {delta}% <span className={classes.deltaNote}>vs last week</span>
    </span>
  );
}

function StatCell({ item }: { item: StatItem }) {
  const body = (
    <>
      <div className={classes.head}>
        <span className={classes.icon}>{item.icon}</span>
        <span className={classes.label}>{item.label}</span>
        {item.onClick && <ChevronRightIcon size={14} className={classes.chevron} />}
      </div>
      <div className={classes.value}>{item.value}</div>
      <div className={classes.foot}>
        {item.delta !== undefined ? (
          <Delta delta={item.delta} inverse={item.inverseDelta} />
        ) : (
          item.caption && <span className={classes.caption}>{item.caption}</span>
        )}
      </div>
    </>
  );

  return item.onClick ? (
    <UnstyledButton className={classes.cell} data-clickable onClick={item.onClick}>
      {body}
    </UnstyledButton>
  ) : (
    <div className={classes.cell}>{body}</div>
  );
}

export function StatStrip({ items, loading }: { items: StatItem[]; loading?: boolean }) {
  return (
    <div className={`surface-card ${classes.strip}`}>
      {loading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={classes.cell}>
              <Skeleton height={10} width={70} radius="sm" />
              <Skeleton height={24} width={56} radius="sm" mt={14} />
              <Skeleton height={10} width={90} radius="sm" mt={12} />
            </div>
          ))
        : items.map((item) => <StatCell key={item.key} item={item} />)}
    </div>
  );
}

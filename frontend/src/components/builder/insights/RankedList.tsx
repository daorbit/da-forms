import type { CSSProperties, ReactNode } from 'react';
import { percent } from './insightMath';
import classes from './InsightsModal.module.css';

export interface RankedItem {
  key: string;
  label: string;
  value: number;
}

interface Props {
  title: string;
  icon: ReactNode;
  items: RankedItem[];
  unit: string;
  empty: ReactNode;
}

const LIMIT = 5;

export function RankedList({ title, icon, items, unit, empty }: Props) {
  const total = items.reduce((n, item) => n + item.value, 0);

  return (
    <section className={classes.card}>
      <div className={classes.cardHead}>
        <span className={classes.cardTitle}>
          <span className={classes.cardIcon}>{icon}</span>
          {title}
        </span>
        {items.length > 0 && (
          <span className={classes.cardSub}>
            {total.toLocaleString()} {unit}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className={classes.listEmpty}>{empty}</div>
      ) : (
        <ul className={classes.ranked}>
          {items.slice(0, LIMIT).map((item) => (
            <li key={item.key} className={classes.rankedItem}>
              <div className={classes.rankedRow}>
                <span className={classes.rankedLabel}>{item.label}</span>
                <span className={classes.rankedValue}>
                  {item.value.toLocaleString()}
                  <span className={classes.rankedPct}>{percent(item.value, total)}%</span>
                </span>
              </div>
              <span className={classes.meter}>
                <span
                  className={classes.meterFill}
                  style={{ '--w': `${percent(item.value, total)}%` } as CSSProperties}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import type { CSSProperties, ReactNode } from 'react';
import { SignpostIcon } from 'lucide-react';
import type { SourceBreakdownEntry } from '@/lib/api';
import { NOT_TRACKED } from '@/lib/leadSource';
import { percent } from './insightMath';
import classes from './InsightsModal.module.css';
import sources from './LeadSourcesCard.module.css';

interface Props {
  items: SourceBreakdownEntry[];
  empty: ReactNode;
  limit?: number;
  footer?: ReactNode;
}

export function LeadSourcesCard({ items, empty, limit = 8, footer }: Props) {
  const leads = items.reduce((n, item) => n + item.count, 0);
  const won = items.reduce((n, item) => n + item.won, 0);
  const top = items[0]?.count ?? 0;

  return (
    <section className={classes.card}>
      <div className={classes.cardHead}>
        <span className={classes.cardTitle}>
          <span className={classes.cardIcon}>
            <SignpostIcon size={14} />
          </span>
          Lead sources
        </span>
        {items.length > 0 && (
          <span className={classes.cardSub}>
            {leads.toLocaleString()} leads · {won.toLocaleString()} won
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className={classes.listEmpty}>{empty}</div>
      ) : (
        <div className={sources.table} role="table" aria-label="Lead sources">
          <div className={sources.row} data-head role="row">
            <span role="columnheader">Source</span>
            <span role="columnheader">Leads</span>
            <span role="columnheader">Won</span>
            <span role="columnheader">Win rate</span>
          </div>
          {items.slice(0, limit).map((item) => (
            <div key={item.source} className={sources.item} role="row">
              <div className={sources.row}>
                <span className={sources.label} data-muted={item.source === NOT_TRACKED || undefined} role="cell">
                  {item.source}
                </span>
                <span className={sources.value} role="cell">
                  {item.count.toLocaleString()}
                </span>
                <span className={sources.value} data-won={item.won > 0 || undefined} role="cell">
                  {item.won.toLocaleString()}
                </span>
                <span className={sources.value} role="cell">
                  {percent(item.won, item.count)}%
                </span>
              </div>
              <span className={classes.meter}>
                <span
                  className={classes.meterFill}
                  style={{ '--w': `${percent(item.count, top)}%` } as CSSProperties}
                />
              </span>
            </div>
          ))}
        </div>
      )}

      {footer && <div className={sources.footer}>{footer}</div>}
    </section>
  );
}

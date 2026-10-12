import type { ReactNode } from 'react';
import { ArrowDownRightIcon, ArrowUpRightIcon, EyeIcon, InboxIcon, PercentIcon } from 'lucide-react';
import type { Analytics } from '@/lib/api';
import { rateChange, weekChange } from './insightMath';
import classes from './InsightsModal.module.css';

interface Kpi {
  key: string;
  icon: ReactNode;
  label: string;
  value: string;
  change: number | null;
}

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className={classes.kpiNote}>No prior week yet</span>;
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  return (
    <span className={classes.change} data-dir={dir}>
      {dir === 'up' && <ArrowUpRightIcon size={12} />}
      {dir === 'down' && <ArrowDownRightIcon size={12} />}
      {Math.abs(value)}%
      <span className={classes.changeNote}>vs last week</span>
    </span>
  );
}

export function InsightKpis({ analytics }: { analytics: Analytics }) {
  const daily = analytics.daily ?? [];
  const items: Kpi[] = [
    {
      key: 'views',
      icon: <EyeIcon size={14} />,
      label: 'Views',
      value: analytics.viewCount.toLocaleString(),
      change: weekChange(daily, (d) => d.views),
    },
    {
      key: 'responses',
      icon: <InboxIcon size={14} />,
      label: 'Responses',
      value: analytics.submissionCount.toLocaleString(),
      change: weekChange(daily, (d) => d.responses),
    },
    {
      key: 'completion',
      icon: <PercentIcon size={14} />,
      label: 'Completion rate',
      value: `${Math.min(100, Math.round(analytics.completionRate * 100))}%`,
      change: rateChange(daily),
    },
  ];

  return (
    <div className={classes.kpis}>
      {items.map((item) => (
        <div key={item.key} className={classes.kpi}>
          <span className={classes.kpiLabel}>
            <span className={classes.kpiIcon}>{item.icon}</span>
            {item.label}
          </span>
          <span className={classes.kpiValue}>{item.value}</span>
          <Change value={item.change} />
        </div>
      ))}
    </div>
  );
}

import { CheckCheckIcon, EyeIcon, InboxIcon, TimerIcon, WalletIcon } from 'lucide-react';
import type { AnalyticsRange, FormsAnalytics } from '@/types/formsAnalytics';
import { change, compact, duration, money, pct, shortDate } from './analyticsFormat';
import { StatTile, type StatTileProps } from './StatTile';
import classes from './StatTile.module.css';

const RANGE_LABEL: Record<AnalyticsRange, string> = {
  '7d': 'previous 7 days',
  '30d': 'previous 30 days',
  '90d': 'previous 90 days',
};

function lastTile(data: FormsAnalytics): StatTileProps & { key: string } {
  const revenue = data.revenue[0];
  if (revenue) {
    return {
      key: 'revenue',
      icon: WalletIcon,
      tone: 'green',
      label: 'Paid revenue',
      value: money(revenue.amount, revenue.currency),
      money: true,
      subline: `${revenue.payments.toLocaleString()} payments`,
    };
  }
  return {
    key: 'duration',
    icon: TimerIcon,
    tone: 'green',
    label: 'Avg. time to complete',
    value: data.duration ? duration(data.duration.averageMs) : '—',
    subline: data.duration ? `From ${data.duration.timed.toLocaleString()} responses` : 'Recorded from new responses',
  };
}

export function KpiStrip({ data, range }: { data: FormsAnalytics; range: AnalyticsRange }) {
  const { totals, previous } = data;
  const period = RANGE_LABEL[range];
  const series = (pick: (d: FormsAnalytics['daily'][number]) => number) =>
    data.daily.map((d) => ({ label: shortDate(d.date), value: pick(d) }));
  const rateBefore = previous.completionRate;

  const tiles: (StatTileProps & { key: string })[] = [
    {
      key: 'views',
      icon: EyeIcon,
      tone: 'blue',
      label: 'Views',
      value: compact(totals.views),
      delta: change(totals.views, previous.views),
      subline: `vs ${compact(previous.views)} · ${period}`,
      points: series((d) => d.views),
      format: (v) => v.toLocaleString(),
    },
    {
      key: 'responses',
      icon: InboxIcon,
      tone: 'orange',
      label: 'Responses',
      value: compact(totals.responses),
      delta: change(totals.responses, previous.responses),
      subline: `vs ${compact(previous.responses)} · ${period}`,
      points: series((d) => d.responses),
      format: (v) => v.toLocaleString(),
    },
    {
      key: 'completion',
      icon: CheckCheckIcon,
      tone: 'purple',
      label: 'Completion rate',
      value: pct(totals.completionRate),
      delta: rateBefore > 0 ? Math.round(((totals.completionRate - rateBefore) / rateBefore) * 100) : null,
      subline: `vs ${pct(rateBefore)} · ${period}`,
      points: series((d) => (d.views ? Math.min(1, d.responses / d.views) : 0)),
      format: pct,
    },
    lastTile(data),
  ];

  return (
    <div className={classes.grid}>
      {tiles.map(({ key, ...tile }) => (
        <StatTile key={key} {...tile} />
      ))}
    </div>
  );
}

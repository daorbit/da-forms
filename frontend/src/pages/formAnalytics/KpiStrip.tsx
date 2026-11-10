import type { FormsAnalytics } from '@/types/formsAnalytics';
import { change, compact, duration, money, pct } from './analyticsFormat';
import { DeltaBadge } from './DeltaBadge';
import { Sparkline } from './Sparkline';
import classes from './FormAnalytics.module.css';

interface Tile {
  key: string;
  label: string;
  value: string;
  delta: number | null;
  series?: number[];
  money?: boolean;
  note?: string;
}

function completionSeries(data: FormsAnalytics): number[] {
  return data.daily.map((d) => (d.views ? Math.min(1, d.responses / d.views) : 0));
}

function lastTile(data: FormsAnalytics): Tile {
  const revenue = data.revenue[0];
  if (revenue) {
    return {
      key: 'revenue',
      label: 'Paid revenue',
      value: money(revenue.amount, revenue.currency),
      delta: null,
      money: true,
      note: `${revenue.payments.toLocaleString()} payments`,
    };
  }
  return {
    key: 'duration',
    label: 'Average time to complete',
    value: data.duration ? duration(data.duration.averageMs) : '—',
    delta: null,
    note: data.duration ? `From ${data.duration.timed.toLocaleString()} responses` : 'Recorded from new responses',
  };
}

export function KpiStrip({ data }: { data: FormsAnalytics }) {
  const { totals, previous } = data;
  const rateNow = totals.completionRate;
  const rateBefore = previous.completionRate;

  const tiles: Tile[] = [
    {
      key: 'views',
      label: 'Views',
      value: compact(totals.views),
      delta: change(totals.views, previous.views),
      series: data.daily.map((d) => d.views),
    },
    {
      key: 'responses',
      label: 'Responses',
      value: compact(totals.responses),
      delta: change(totals.responses, previous.responses),
      series: data.daily.map((d) => d.responses),
    },
    {
      key: 'completion',
      label: 'Completion rate',
      value: pct(rateNow),
      delta: rateBefore > 0 ? Math.round(((rateNow - rateBefore) / rateBefore) * 100) : null,
      series: completionSeries(data),
    },
    lastTile(data),
  ];

  return (
    <div className={classes.kpis}>
      {tiles.map((tile) => (
        <div key={tile.key} className={classes.kpi}>
          <span className={classes.kpiLabel}>{tile.label}</span>
          <span className={classes.kpiValue} data-money={tile.money || undefined}>
            {tile.value}
          </span>
          <div className={classes.kpiFoot}>
            {tile.note ? (
              <span className={classes.delta}>{tile.note}</span>
            ) : (
              <DeltaBadge value={tile.delta} note="vs before" />
            )}
            {tile.series && <Sparkline values={tile.series} />}
          </div>
        </div>
      ))}
    </div>
  );
}

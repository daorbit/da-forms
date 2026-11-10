import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import type { AnalyticsDay } from '@/types/formsAnalytics';
import { AnalyticsCard } from './AnalyticsCard';
import { compact, pct, shortDate } from './analyticsFormat';
import classes from './FormAnalytics.module.css';

type Metric = 'responses' | 'views' | 'completion';

const METRICS: { value: Metric; label: string }[] = [
  { value: 'responses', label: 'Responses' },
  { value: 'views', label: 'Views' },
  { value: 'completion', label: 'Completion' },
];

function valueOf(day: AnalyticsDay, metric: Metric): number {
  if (metric === 'completion') return day.views ? Math.min(1, day.responses / day.views) : 0;
  return day[metric];
}

function format(value: number, metric: Metric): string {
  return metric === 'completion' ? pct(value) : value.toLocaleString();
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: { payload?: { date: string; value: number } }[];
  metric: Metric;
}

function TrendTooltip({ active, payload, metric }: TrendTooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className={classes.tooltip}>
      <div className={classes.tooltipDate}>{shortDate(point.date)}</div>
      <div className={classes.tooltipValue}>{format(point.value, metric)}</div>
    </div>
  );
}

export function TrendCard({ daily }: { daily: AnalyticsDay[] }) {
  const [metric, setMetric] = useState<Metric>('responses');
  const data = daily.map((day) => ({ date: day.date, value: valueOf(day, metric) }));
  const tickGap = Math.max(1, Math.round(daily.length / 7));

  return (
    <AnalyticsCard
      title="Trend"
      subtitle={`${shortDate(daily[0]?.date ?? '')} – ${shortDate(daily[daily.length - 1]?.date ?? '')}`}
      actions={<SegmentedTabs size="sm" value={metric} onChange={setMetric} data={METRICS} ariaLabel="Chart metric" />}
    >
      <div className={classes.trend}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              interval={tickGap - 1}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickFormatter={(v: number) => (metric === 'completion' ? pct(v) : compact(v))}
              tickLine={false}
              axisLine={false}
              width={48}
              allowDecimals={metric === 'completion'}
            />
            <Tooltip content={<TrendTooltip metric={metric} />} />
            <Area type="monotone" dataKey="value" className={classes.accentArea} isAnimationActive={false} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsCard>
  );
}

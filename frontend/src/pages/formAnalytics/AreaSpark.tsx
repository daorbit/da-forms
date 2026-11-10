import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import classes from './StatTile.module.css';

interface SparkPoint {
  label: string;
  value: number;
}

function SparkTip({
  active,
  payload,
  format,
}: {
  active?: boolean;
  payload?: { payload: SparkPoint }[];
  format: (value: number) => string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className={classes.tip}>
      <span className={classes.tipLabel}>{point.label}</span>
      {format(point.value)}
    </div>
  );
}

export function AreaSpark({ points, format }: { points: SparkPoint[]; format: (value: number) => string }) {
  return (
    <div className={classes.spark}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <Tooltip
            content={<SparkTip format={format} />}
            cursor={{ stroke: 'currentColor', strokeOpacity: 0.35, strokeWidth: 1 }}
            isAnimationActive={false}
            allowEscapeViewBox={{ x: false, y: true }}
            offset={8}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="currentColor"
            strokeWidth={2}
            fill="currentColor"
            fillOpacity={0.18}
            dot={false}
            activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2, fill: 'currentColor' }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

import { Bar, BarChart, ResponsiveContainer } from 'recharts';
import classes from './FormAnalytics.module.css';

export function Sparkline({ values }: { values: number[] }) {
  const data = values.map((value, index) => ({ index, value }));
  return (
    <div className={classes.spark} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }} barCategoryGap={1}>
          <Bar dataKey="value" className={classes.bars} radius={[2, 2, 0, 0]} isAnimationActive={false} minPointSize={1} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

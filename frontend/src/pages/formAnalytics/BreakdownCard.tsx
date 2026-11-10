import { Progress } from '@mantine/core';
import { AnalyticsCard } from './AnalyticsCard';
import { share } from './analyticsFormat';
import classes from './FormAnalytics.module.css';

export interface BreakdownItem {
  key: string;
  label: string;
  value: number;
}

interface Props {
  title: string;
  subtitle?: string;
  items: BreakdownItem[];
  empty: string;
}

const LIMIT = 6;

export function BreakdownCard({ title, subtitle, items, empty }: Props) {
  const total = items.reduce((n, item) => n + item.value, 0);
  return (
    <AnalyticsCard title={title} subtitle={subtitle}>
      {items.length === 0 || total === 0 ? (
        <div className={classes.empty}>{empty}</div>
      ) : (
        <div className={classes.funnel}>
          {items.slice(0, LIMIT).map((item) => (
            <div key={item.key} className={classes.step}>
              <div className={classes.stepHead}>
                <span className={classes.formTitle}>{item.label}</span>
                <span className={classes.stepValue}>
                  {item.value.toLocaleString()}
                  <span className={classes.deltaNote}>{share(item.value, total)}%</span>
                </span>
              </div>
              <Progress size={6} radius="xl" value={share(item.value, total)} color="var(--accent)" />
            </div>
          ))}
        </div>
      )}
    </AnalyticsCard>
  );
}

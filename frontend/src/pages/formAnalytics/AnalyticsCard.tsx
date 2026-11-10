import type { ReactNode } from 'react';
import classes from './FormAnalytics.module.css';

interface Props {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function AnalyticsCard({ title, subtitle, actions, children }: Props) {
  return (
    <section className={classes.card}>
      <div className={classes.cardHead}>
        <div>
          <div className={classes.cardTitle}>{title}</div>
          {subtitle && <div className={classes.cardSub}>{subtitle}</div>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

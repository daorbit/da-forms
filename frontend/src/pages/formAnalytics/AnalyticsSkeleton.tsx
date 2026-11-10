import classes from './FormAnalytics.module.css';

export function AnalyticsSkeleton() {
  return (
    <div className={classes.stack} aria-busy="true" aria-label="Loading analytics">
      <div className={classes.skeleton} data-size="kpis" />
      <div className={classes.split}>
        <div className={classes.skeleton} data-size="chart" />
        <div className={classes.skeleton} data-size="chart" />
      </div>
      <div className={classes.skeleton} data-size="list" />
    </div>
  );
}

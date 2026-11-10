import classes from './FormAnalytics.module.css';

const TILES = [0, 1, 2, 3];

export function AnalyticsSkeleton() {
  return (
    <div className={classes.stack} aria-busy="true" aria-label="Loading analytics">
      <div className={classes.skeletonTiles}>
        {TILES.map((i) => (
          <div key={i} className={classes.skeleton} data-size="tile" />
        ))}
      </div>
      <div className={classes.split}>
        <div className={classes.skeleton} data-size="chart" />
        <div className={classes.skeleton} data-size="chart" />
      </div>
      <div className={classes.skeleton} data-size="list" />
    </div>
  );
}

export function AnalyticsPageSkeleton() {
  return (
    <div className={classes.page}>
      <div className={classes.skeleton} data-size="header" />
      <AnalyticsSkeleton />
    </div>
  );
}

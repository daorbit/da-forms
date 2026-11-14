import { Skeleton } from '@mantine/core';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChartSkeleton, ListSkeleton, StatCardSkeleton } from '@/components/ui/skeleton/Skeletons';
import classes from './FormAnalytics.module.css';

const TILES = [0, 1, 2, 3];

export function AnalyticsSkeleton() {
  return (
    <div className={classes.stack} aria-busy="true" aria-label="Loading analytics">
      <div className={classes.skeletonTiles}>
        {TILES.map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className={classes.split}>
        <ChartSkeleton height={240} actions={0} />
        <ListSkeleton rows={5} aside={false} />
      </div>
      <ListSkeleton rows={6} />
    </div>
  );
}

export function AnalyticsToolbarSkeleton() {
  return (
    <div className={classes.toolbar}>
      <Skeleton height={36} width={230} radius={10} />
      <Skeleton height={36} width={240} maw="100%" radius={10} />
    </div>
  );
}

export function AnalyticsPageSkeleton({ title, description }: { title: string; description: string }) {
  return (
    <div className={classes.page}>
      <PageHeader title={title} description={description} />
      <AnalyticsToolbarSkeleton />
      <AnalyticsSkeleton />
    </div>
  );
}

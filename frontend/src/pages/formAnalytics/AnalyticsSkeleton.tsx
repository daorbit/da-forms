import { PageHeader } from '@/components/ui/PageHeader';
import { Brick, Bricks } from '@/components/ui/skeleton/Bricks';
import type { BrickRow } from '@/lib/brickRows';
import classes from './FormAnalytics.module.css';

const ROWS: BrickRow[] = [{ height: 150, cols: 4 }, { height: 360, split: 'lead' }, { height: 320 }];

export function AnalyticsSkeleton() {
  return <Bricks rows={ROWS} label="Loading analytics" />;
}

export function AnalyticsToolbarSkeleton() {
  return (
    <div className={classes.toolbar}>
      <Brick height={36} width={480} />
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

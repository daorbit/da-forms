import { Brick, Bricks } from '@/components/ui/skeleton/Bricks';
import { brickRows, type BrickRow } from '@/lib/brickRows';
import classes from './EntriesCalendar.module.css';

const UPCOMING_ROWS: BrickRow[] = [{ height: 150 }, ...brickRows(4, 76)];

export function CalendarMonthSkeleton() {
  return (
    <div className={classes.monthSkeleton}>
      <Brick height={560} />
    </div>
  );
}

export function UpcomingSkeleton() {
  return <Bricks rows={UPCOMING_ROWS} label="Loading upcoming bookings" />;
}

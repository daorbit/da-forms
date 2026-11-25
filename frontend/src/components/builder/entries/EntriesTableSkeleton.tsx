import { Bricks } from '@/components/ui/skeleton/Bricks';
import { brickRows, type BrickRow } from '@/lib/brickRows';

const ROWS: BrickRow[] = [{ height: 44 }, ...brickRows(8, 56)];

export function EntriesTableSkeleton() {
  return <Bricks rows={ROWS} label="Loading responses" />;
}

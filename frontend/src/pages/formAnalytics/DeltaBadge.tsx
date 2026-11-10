import { ArrowDownRightIcon, ArrowUpRightIcon } from 'lucide-react';
import classes from './FormAnalytics.module.css';

export function DeltaBadge({ value, note }: { value: number | null; note?: string }) {
  if (value === null) return null;
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  return (
    <span className={classes.delta} data-dir={dir}>
      {dir === 'up' && <ArrowUpRightIcon size={12} />}
      {dir === 'down' && <ArrowDownRightIcon size={12} />}
      {Math.abs(value)}%
      {note && <span className={classes.deltaNote}>{note}</span>}
    </span>
  );
}

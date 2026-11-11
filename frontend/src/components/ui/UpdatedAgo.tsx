import { useEffect, useState } from 'react';
import { updatedAgoLabel } from '@/lib/relativeTime';
import classes from './UpdatedAgo.module.css';

const TICK_MS = 30_000;

export function UpdatedAgo({ at }: { at: number | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (at === null) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [at]);

  if (at === null) return null;
  return (
    <span className={classes.text} title={new Date(at).toLocaleString()}>
      <span key={now}>{updatedAgoLabel(at)}</span>
    </span>
  );
}

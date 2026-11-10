import { useEffect, useState } from 'react';
import { notify } from '@/lib/notify';

export function useRangedFetch<R extends string, T>(
  load: (range: R) => Promise<T>,
  initialRange: R,
  errorMessage: string,
  deps: unknown[],
  enabled = true,
) {
  const [range, setRange] = useState<R>(initialRange);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    load(range)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) notify.error(errorMessage);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, enabled, ...deps]);

  return { data, range, setRange, loading };
}

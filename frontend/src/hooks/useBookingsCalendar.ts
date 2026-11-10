import { useCallback, useEffect, useState } from 'react';
import { getBookingsCalendar, type BookingsCalendar } from '@/lib/api';
import { notify } from '@/lib/notify';

export function useBookingsCalendar(workspaceId: string, period: { from: Date; to: Date } | null) {
  const [data, setData] = useState<BookingsCalendar | null>(null);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);
  const fromKey = period?.from.getTime();
  const toKey = period?.to.getTime();

  useEffect(() => {
    if (fromKey === undefined || toKey === undefined) return;
    let cancelled = false;
    setLoading(true);
    getBookingsCalendar(new Date(fromKey), new Date(toKey), workspaceId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) notify.error('Could not load bookings');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, fromKey, toKey, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, loading, reload };
}

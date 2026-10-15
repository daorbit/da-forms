import { useCallback, useEffect, useState } from 'react';
import type { CalendarStatus } from '@/types';
import { getCalendarStatus } from '@/lib/api';
import { onReturnFromConnections } from '@/lib/hostConnections';

const UNAVAILABLE: CalendarStatus = { configured: false, connected: false, calendars: [] };

export function useCalendarConnection(workspaceId: string, enabled = true) {
  const [status, setStatus] = useState<CalendarStatus | null>(null);

  const refresh = useCallback(
    () =>
      getCalendarStatus(workspaceId)
        .then(setStatus)
        .catch(() => setStatus(UNAVAILABLE)),
    [workspaceId]
  );

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    return onReturnFromConnections(() => void refresh());
  }, [enabled, refresh]);

  return { status, refresh };
}

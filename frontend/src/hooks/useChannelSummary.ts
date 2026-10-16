import { useCallback, useEffect, useState } from 'react';
import { onReturnFromConnections } from '@/lib/hostConnections';

export function useChannelSummary<T>(fetcher: (workspaceId: string) => Promise<T>, workspaceId: string, active: boolean) {
  const [summary, setSummary] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    fetcher(workspaceId)
      .then(setSummary)
      .catch(() => setFailed(true));
  }, [fetcher, workspaceId]);

  useEffect(() => {
    if (!active) return;
    load();
    return onReturnFromConnections(load);
  }, [active, load]);

  return { summary, failed, reload: load };
}

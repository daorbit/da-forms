import { useCallback, useEffect, useState } from 'react';
import { getTelegramSummary } from '@/lib/api';
import { onReturnFromConnections } from '@/lib/hostConnections';
import type { TelegramSummary } from '@/types';

export function useTelegramSummary(workspaceId: string, active: boolean) {
  const [summary, setSummary] = useState<TelegramSummary | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    getTelegramSummary(workspaceId)
      .then(setSummary)
      .catch(() => setFailed(true));
  }, [workspaceId]);

  useEffect(() => {
    if (!active) return;
    load();
    return onReturnFromConnections(load);
  }, [active, load]);

  return { summary, failed, reload: load };
}

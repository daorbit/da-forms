import { useCallback, useEffect, useState } from 'react';
import { getFormsAnalytics } from '@/lib/api';
import { notify } from '@/lib/notify';
import type { AnalyticsRange, FormsAnalytics } from '@/types/formsAnalytics';

interface Loaded {
  data: FormsAnalytics;
  at: number;
}

const loaded = new Map<string, Loaded>();

function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

const TIMEZONE = browserTimezone();

export function useFormsAnalytics(workspaceId: string, range: AnalyticsRange, formId: string | null) {
  const key = `${workspaceId}:${range}:${formId ?? 'all'}`;
  const [entry, setEntry] = useState<Loaded | null>(() => loaded.get(key) ?? null);
  const [loading, setLoading] = useState(!loaded.has(key));
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const cached = loaded.get(key);
    if (cached) {
      setEntry(cached);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    getFormsAnalytics({ range, formId, timezone: TIMEZONE }, workspaceId)
      .then((result) => {
        if (!live) return;
        const next = { data: result, at: Date.now() };
        loaded.set(key, next);
        setEntry(next);
      })
      .catch(() => {
        if (live) notify.error('Could not load form analytics.');
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [key, workspaceId, range, formId]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await getFormsAnalytics({ range, formId, timezone: TIMEZONE, fresh: true }, workspaceId);
      const next = { data: result, at: Date.now() };
      loaded.set(key, next);
      setEntry(next);
    } catch {
      notify.error('Could not refresh form analytics.');
    } finally {
      setRefreshing(false);
    }
  }, [key, workspaceId, range, formId]);

  return { data: entry?.data ?? null, updatedAt: entry?.at ?? null, loading, refreshing, refresh };
}

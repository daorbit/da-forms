import { useEffect, useState } from 'react';
import { getFormsAnalytics } from '@/lib/api';
import { notify } from '@/lib/notify';
import type { AnalyticsRange, FormsAnalytics } from '@/types/formsAnalytics';

const loaded = new Map<string, FormsAnalytics>();

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
  const [data, setData] = useState<FormsAnalytics | null>(() => loaded.get(key) ?? null);
  const [loading, setLoading] = useState(!loaded.has(key));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const cached = loaded.get(key);
    if (cached) {
      setData(cached);
      setLoading(false);
      setFailed(false);
      return;
    }
    let live = true;
    setLoading(true);
    setFailed(false);
    getFormsAnalytics({ range, formId, timezone: TIMEZONE }, workspaceId)
      .then((result) => {
        if (!live) return;
        loaded.set(key, result);
        setData(result);
      })
      .catch(() => {
        if (!live) return;
        setFailed(true);
        notify.error('Could not load form analytics.');
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [key, workspaceId, range, formId]);

  return { data, loading, failed };
}

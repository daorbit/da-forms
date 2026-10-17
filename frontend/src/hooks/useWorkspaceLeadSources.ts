import { useEffect, useState } from 'react';
import { getLeadSources, type LeadSourceRange, type WorkspaceLeadSources } from '@/lib/api';
import { notify } from '@/lib/notify';

export function useWorkspaceLeadSources(workspaceId: string, enabled: boolean) {
  const [range, setRange] = useState<LeadSourceRange>('90d');
  const [data, setData] = useState<WorkspaceLeadSources | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    getLeadSources(range, workspaceId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) notify.error('Could not load lead sources');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, range, enabled]);

  return { data, range, setRange, loading };
}

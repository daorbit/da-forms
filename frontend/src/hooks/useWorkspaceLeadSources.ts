import { getLeadSources, type LeadSourceRange } from '@/lib/api';
import { useRangedFetch } from './useRangedFetch';

export function useWorkspaceLeadSources(workspaceId: string, enabled: boolean) {
  return useRangedFetch<LeadSourceRange, Awaited<ReturnType<typeof getLeadSources>>>(
    (range) => getLeadSources(range, workspaceId),
    '90d',
    'Could not load lead sources',
    [workspaceId],
    enabled,
  );
}

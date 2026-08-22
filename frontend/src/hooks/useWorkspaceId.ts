import { useParams } from 'react-router-dom';
import { DEFAULT_WORKSPACE } from '@/lib/api';

/**
 * The workspace the current screen belongs to.
 *
 * Comes from the route, so the same build serves a standalone install and one
 * embedded in a host product that passes its own workspace id.
 */
export function useWorkspaceId() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  return workspaceId ?? DEFAULT_WORKSPACE;
}

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IS_EMBEDDED } from '@/lib/bootParams';
import { openHostForms } from '@/lib/hostConnections';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

export function useGoToForms() {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  return useCallback(() => {
    if (IS_EMBEDDED) openHostForms();
    else navigate(`/${workspaceId}/forms`);
  }, [navigate, workspaceId]);
}

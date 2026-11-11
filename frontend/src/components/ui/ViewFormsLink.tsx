import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon } from 'lucide-react';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { IS_EMBEDDED } from '@/lib/bootParams';
import { openHostForms } from '@/lib/hostConnections';
import classes from './ViewFormsLink.module.css';

export function ViewFormsLink() {
  const workspaceId = useWorkspaceId();
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!IS_EMBEDDED) return;
    event.preventDefault();
    openHostForms();
  };

  return (
    <Link to={`/${workspaceId}/forms`} className={classes.link} onClick={onClick}>
      View forms
      <ArrowUpRightIcon size={14} className={classes.icon} />
    </Link>
  );
}

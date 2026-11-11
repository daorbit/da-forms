import { Link } from 'react-router-dom';
import { ArrowUpRightIcon } from 'lucide-react';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import classes from './ViewFormsLink.module.css';

export function ViewFormsLink() {
  const workspaceId = useWorkspaceId();
  return (
    <Link to={`/${workspaceId}/forms`} className={classes.link}>
      View forms
      <ArrowUpRightIcon size={14} className={classes.icon} />
    </Link>
  );
}

import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon } from 'lucide-react';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { IS_EMBEDDED } from '@/lib/bootParams';
import { HOST_FORMS_URL, openHostForms } from '@/lib/hostConnections';
import classes from './ViewFormsLink.module.css';

function Label(): ReactNode {
  return (
    <>
      View forms
      <ArrowUpRightIcon size={14} className={classes.icon} />
    </>
  );
}

function HostFormsLink() {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    openHostForms();
  };

  return (
    <a href={HOST_FORMS_URL} target="_top" className={classes.link} onClick={onClick}>
      <Label />
    </a>
  );
}

export function ViewFormsLink() {
  const workspaceId = useWorkspaceId();
  if (IS_EMBEDDED) return <HostFormsLink />;
  return (
    <Link to={`/${workspaceId}/forms`} className={classes.link}>
      <Label />
    </Link>
  );
}

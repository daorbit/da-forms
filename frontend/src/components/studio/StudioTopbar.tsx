import type { ReactNode } from 'react';
import { ActionIcon } from '@mantine/core';
import { XIcon } from 'lucide-react';
import classes from './Studio.module.css';

interface Props {
  title: string;
  subtitle?: string;
  center?: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
}

export function StudioTopbar({ title, subtitle, center, actions, onClose }: Props) {
  return (
    <header className={classes.topbar}>
      <div className={classes.heading}>
        <span className={classes.title}>{title}</span>
        {subtitle && <span className={classes.subtitle}>{subtitle}</span>}
      </div>
      <div className={classes.center}>{center}</div>
      <div className={classes.actions}>
        {actions}
        <ActionIcon variant="transparent" className={classes.close} onClick={onClose} aria-label="Close">
          <XIcon size={17} />
        </ActionIcon>
      </div>
    </header>
  );
}

import type { ReactNode } from 'react';
import classes from './Studio.module.css';

interface Props {
  title: string;
  subtitle?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function StudioPanel({ title, subtitle, footer, children }: Props) {
  return (
    <aside className={classes.panel}>
      <div className={classes.panelHeader}>
        <div className={classes.panelTitle}>{title}</div>
        {subtitle && <div className={classes.panelSubtitle}>{subtitle}</div>}
      </div>
      <div className={classes.panelScroll}>{children}</div>
      {footer && <div className={classes.panelFooter}>{footer}</div>}
    </aside>
  );
}

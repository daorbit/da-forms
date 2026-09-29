import type { ReactNode } from 'react';
import { ActionIcon, Drawer } from '@mantine/core';
import { XIcon } from 'lucide-react';
import classes from './PanelDrawer.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  iconVariant?: 'well' | 'plain';
  headerActions?: ReactNode;
  footer?: ReactNode;
  size?: number;
  bare?: boolean;
  ariaLabel?: string;
  children: ReactNode;
}

export function PanelDrawer({
  opened,
  onClose,
  title,
  subtitle,
  icon,
  iconVariant = 'well',
  headerActions,
  footer,
  size = 460,
  bare = false,
  ariaLabel,
  children,
}: Props) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={size}
      padding={0}
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.35 }}
      transitionProps={{ duration: 180, transition: 'slide-left' }}
      classNames={{ content: classes.content, body: classes.body }}
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
    >
      <header className={classes.header}>
        <div className={classes.heading}>
          {icon && (
            <span className={classes.icon} data-variant={iconVariant}>
              {icon}
            </span>
          )}
          <div className={classes.titles}>
            <div className={classes.title}>{title}</div>
            {subtitle && <div className={classes.subtitle}>{subtitle}</div>}
          </div>
        </div>
        <div className={classes.actions}>
          {headerActions}
          <ActionIcon variant="transparent" className={classes.close} onClick={onClose} aria-label="Close">
            <XIcon size={16} />
          </ActionIcon>
        </div>
      </header>

      {bare ? (
        children
      ) : (
        <div className={classes.scroll}>
          <div className={classes.padded}>{children}</div>
        </div>
      )}

      {footer && <footer className={classes.footer}>{footer}</footer>}
    </Drawer>
  );
}

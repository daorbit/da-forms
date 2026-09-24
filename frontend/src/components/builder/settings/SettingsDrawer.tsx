import type { ReactNode } from 'react';
import { Drawer } from '@mantine/core';
import classes from './settings.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  children: ReactNode;
}

export function SettingsDrawer({ opened, onClose, title, subtitle, icon, children }: Props) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={460}
      padding={0}
      radius="lg"
      transitionProps={{ duration: 180, transition: 'slide-left' }}
      title={
        <span className={classes.titleWrap}>
          <span className={classes.titleIcon}>{icon}</span>
          <span>
            <div className={classes.titleText}>{title}</div>
            {subtitle && <div className={classes.subtitle}>{subtitle}</div>}
          </span>
        </span>
      }
      classNames={{ header: classes.header, body: classes.body, content: classes.content }}
    >
      <div className={classes.stack}>{children}</div>
    </Drawer>
  );
}

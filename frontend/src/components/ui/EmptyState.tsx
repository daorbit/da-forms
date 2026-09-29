import type { ReactNode } from 'react';
import { Button, Text } from '@mantine/core';
import type { LucideIcon } from 'lucide-react';
import classes from './EmptyState.module.css';

interface Action {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: 'filled' | 'default';
}

interface Props {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: Action;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, compact = false }: Props) {
  return (
    <div className={classes.root} data-compact={compact || undefined}>
      <div className={classes.icon} aria-hidden>
        <Icon size={compact ? 24 : 34} strokeWidth={1.4} />
      </div>
      <Text className={classes.title}>{title}</Text>
      {description && <Text className={classes.description}>{description}</Text>}
      {action && (
        <Button
          className={classes.action}
          variant={action.variant ?? 'filled'}
          leftSection={action.icon ? <action.icon size={16} /> : undefined}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

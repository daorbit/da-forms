import type { ReactNode } from 'react';
import { Switch, Text } from '@mantine/core';
import classes from './AlertsModal.module.css';

interface Props {
  icon: ReactNode;
  tone: 'bell' | 'telegram' | 'whatsapp';
  title: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  children?: ReactNode;
}

export function AlertChannel({ icon, tone, title, description, enabled, onChange, children }: Props) {
  return (
    <section className={classes.channel} data-on={enabled || undefined}>
      <div className={classes.channelHead}>
        <span className={classes.channelIcon} data-tone={tone}>
          {icon}
        </span>
        <div className={classes.channelText}>
          <Text size="sm" fw={600}>
            {title}
          </Text>
          <Text size="xs" c="dimmed" mt={2}>
            {description}
          </Text>
        </div>
        <Switch
          checked={enabled}
          onChange={(e) => onChange(e.currentTarget.checked)}
          color="emerald"
          size="md"
          aria-label={title}
        />
      </div>
      {children && <div className={classes.channelBody}>{children}</div>}
    </section>
  );
}

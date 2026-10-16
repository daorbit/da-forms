import type { ReactNode } from 'react';
import { Button, Loader, Text } from '@mantine/core';
import { CircleAlertIcon, CircleCheckIcon } from 'lucide-react';
import classes from './AlertsModal.module.css';

export interface ChannelAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

interface Props {
  loading: boolean;
  failed: boolean;
  ok: boolean;
  text: string;
  action?: ChannelAction;
  onRetry: () => void;
}

export function ChannelStatus({ loading, failed, ok, text, action, onRetry }: Props) {
  if (failed) {
    return (
      <div className={classes.status}>
        <CircleAlertIcon size={15} className={classes.statusWarn} />
        <Text size="xs" className={classes.statusText}>
          Could not check this channel.
        </Text>
        <Button size="compact-xs" variant="subtle" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={classes.status}>
        <Loader size={14} />
        <Text size="xs" c="dimmed" className={classes.statusText}>
          Checking…
        </Text>
      </div>
    );
  }

  return (
    <div className={classes.status}>
      {ok ? (
        <CircleCheckIcon size={15} className={classes.statusOk} />
      ) : (
        <CircleAlertIcon size={15} className={classes.statusWarn} />
      )}
      <Text size="xs" className={classes.statusText}>
        {text}
      </Text>
      {action && (
        <Button size="compact-xs" variant={ok ? 'subtle' : 'light'} leftSection={action.icon} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

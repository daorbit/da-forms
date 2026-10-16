import { Button, Loader, Text } from '@mantine/core';
import { CircleAlertIcon, CircleCheckIcon, Settings2Icon } from 'lucide-react';
import { openConnections } from '@/lib/hostConnections';
import type { TelegramSummary } from '@/types';
import classes from './AlertsModal.module.css';

interface Props {
  summary: TelegramSummary | null;
  failed: boolean;
  onRetry: () => void;
}

function describe(summary: TelegramSummary): { ok: boolean; text: string; action: string } {
  if (!summary.connected) return { ok: false, text: 'Telegram is not connected yet.', action: 'Connect' };
  if (!summary.alertChats) return { ok: false, text: 'No chat has form alerts on.', action: 'Choose chats' };
  const chats = `${summary.alertChats} chat${summary.alertChats === 1 ? '' : 's'}`;
  return { ok: true, text: summary.sender ? `Posts to ${chats} as ${summary.sender}` : `Posts to ${chats}`, action: 'Manage' };
}

export function TelegramConnectionStatus({ summary, failed, onRetry }: Props) {
  if (failed) {
    return (
      <div className={classes.status}>
        <CircleAlertIcon size={15} className={classes.statusWarn} />
        <Text size="xs" className={classes.statusText}>
          Could not check the Telegram connection.
        </Text>
        <Button size="compact-xs" variant="subtle" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={classes.status}>
        <Loader size={14} />
        <Text size="xs" c="dimmed" className={classes.statusText}>
          Checking Telegram…
        </Text>
      </div>
    );
  }

  const info = describe(summary);
  return (
    <div className={classes.status}>
      {info.ok ? (
        <CircleCheckIcon size={15} className={classes.statusOk} />
      ) : (
        <CircleAlertIcon size={15} className={classes.statusWarn} />
      )}
      <Text size="xs" className={classes.statusText}>
        {info.text}
      </Text>
      <Button
        size="compact-xs"
        variant={info.ok ? 'subtle' : 'light'}
        leftSection={<Settings2Icon size={13} />}
        onClick={() => openConnections('telegram')}
      >
        {info.action}
      </Button>
    </div>
  );
}

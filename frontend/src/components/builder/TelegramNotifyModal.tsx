import { useCallback, useEffect, useState } from 'react';
import { ActionIcon, Button, Divider, Group, Loader, Modal, Stack, Switch, Text } from '@mantine/core';
import { SendIcon, Settings2Icon, XIcon } from 'lucide-react';
import { getTelegramSummary } from '@/lib/api';
import { onReturnFromConnections, openConnections } from '@/lib/hostConnections';
import type { TelegramSummary } from '@/types';
import classes from './TelegramNotifyModal.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  workspaceId: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function describe(summary: TelegramSummary): { tone: 'ok' | 'warn'; title: string; body: string; action: string } {
  if (!summary.connected) {
    return {
      tone: 'warn',
      title: 'Telegram is not connected',
      body: 'Connect the Quantalog bot or your own bot, then link a chat.',
      action: 'Connect Telegram',
    };
  }
  if (!summary.alertChats) {
    return {
      tone: 'warn',
      title: 'No chat has form alerts on',
      body: 'Turn on Form alerts for at least one linked chat, or nothing will be posted.',
      action: 'Choose chats',
    };
  }
  const chats = `${summary.alertChats} chat${summary.alertChats === 1 ? '' : 's'}`;
  return {
    tone: 'ok',
    title: `Posts to ${chats}`,
    body: summary.sender ? `Sent by ${summary.sender}.` : 'Sent by your Telegram bot.',
    action: 'Manage',
  };
}

export function TelegramNotifyModal({ opened, onClose, workspaceId, enabled, onChange }: Props) {
  const [summary, setSummary] = useState<TelegramSummary | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    getTelegramSummary(workspaceId)
      .then(setSummary)
      .catch(() => setFailed(true));
  }, [workspaceId]);

  useEffect(() => {
    if (!opened) return;
    load();
    return onReturnFromConnections(load);
  }, [opened, load]);

  const info = summary ? describe(summary) : null;

  return (
    <Modal opened={opened} onClose={onClose} withCloseButton={false} padding={0} radius="lg" size="md">
      <Group gap="sm" px="lg" py="md" wrap="nowrap">
        <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose} aria-label="Close">
          <XIcon size={18} />
        </ActionIcon>
        <Divider orientation="vertical" my={6} />
        <Text fw={600}>Telegram alerts</Text>
      </Group>
      <Divider />
      <Stack gap="md" px="lg" py="lg">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" align="flex-start">
            <SendIcon size={20} className={classes.icon} />
            <div>
              <Text size="sm" fw={600}>
                Send this form's responses to Telegram
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                Every new response to this form is posted, with its answers, to the workspace's Telegram chats that
                have form alerts on.
              </Text>
            </div>
          </Group>
          <Switch checked={enabled} onChange={(e) => onChange(e.currentTarget.checked)} color="emerald" size="md" />
        </Group>

        {!summary && !failed && (
          <Group justify="center" py="xs">
            <Loader size="sm" />
          </Group>
        )}

        {failed && (
          <div className={classes.status} data-tone="warn">
            <Text size="xs" c="dimmed" className={classes.statusText}>
              Could not check the Telegram connection.
            </Text>
            <Button size="xs" variant="default" className={classes.statusAction} onClick={load}>
              Try again
            </Button>
          </div>
        )}

        {info && (
          <div className={classes.status} data-tone={info.tone}>
            <div className={classes.statusText}>
              <Text size="sm" fw={600}>
                {info.title}
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                {info.body}
              </Text>
            </div>
            <Button
              size="xs"
              variant={info.tone === 'ok' ? 'default' : 'light'}
              leftSection={<Settings2Icon size={14} />}
              className={classes.statusAction}
              onClick={() => openConnections('telegram')}
            >
              {info.action}
            </Button>
          </div>
        )}

        <Text size="xs" c="dimmed">
          Save the form to apply this change.
        </Text>
      </Stack>
    </Modal>
  );
}

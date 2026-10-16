import { ActionIcon, Divider, Group, Modal, Stack, Text } from '@mantine/core';
import { BellRingIcon, MessageCircleIcon, SendIcon, XIcon } from 'lucide-react';
import { useChannelSummary } from '@/hooks/useChannelSummary';
import { getTelegramSummary, getWhatsAppSummary } from '@/lib/api';
import { telegramAlertsOn } from '@/lib/notifyChannels';
import type { NotificationSettings } from '@/types';
import { AlertChannel } from './AlertChannel';
import { TelegramConnectionStatus } from './TelegramConnectionStatus';
import { WhatsAppConnectionStatus } from './WhatsAppConnectionStatus';
import classes from './AlertsModal.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  workspaceId: string;
  notifications: NotificationSettings;
  onChange: (patch: Partial<NotificationSettings>) => void;
}

export function AlertsModal({ opened, onClose, workspaceId, notifications, onChange }: Props) {
  const telegram = useChannelSummary(getTelegramSummary, workspaceId, opened);
  const whatsapp = useChannelSummary(getWhatsAppSummary, workspaceId, opened);

  return (
    <Modal opened={opened} onClose={onClose} withCloseButton={false} padding={0} radius="lg" size="md">
      <Group gap="sm" px="lg" py="md" wrap="nowrap">
        <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose} aria-label="Close">
          <XIcon size={18} />
        </ActionIcon>
        <Divider orientation="vertical" my={6} />
        <div>
          <Text fw={600}>Alerts</Text>
          <Text size="xs" c="dimmed">
            Where you hear about each new response to this form.
          </Text>
        </div>
      </Group>
      <Divider />
      <Stack gap="sm" px="lg" py="lg">
        <AlertChannel
          icon={<BellRingIcon size={18} />}
          tone="bell"
          title="Quantalog notifications"
          description="A row in your Quantalog notification bell, with the answers attached."
          enabled={notifications.ownerInAppEnabled ?? false}
          onChange={(ownerInAppEnabled) => onChange({ ownerInAppEnabled })}
        />
        <AlertChannel
          icon={<MessageCircleIcon size={18} />}
          tone="whatsapp"
          title="WhatsApp"
          description="A message with the answers on the workspace owner's WhatsApp."
          enabled={notifications.whatsappEnabled ?? false}
          onChange={(whatsappEnabled) => onChange({ whatsappEnabled })}
        >
          <WhatsAppConnectionStatus summary={whatsapp.summary} failed={whatsapp.failed} onRetry={whatsapp.reload} />
        </AlertChannel>
        <AlertChannel
          icon={<SendIcon size={18} />}
          tone="telegram"
          title="Telegram"
          description="A message with the answers in every Telegram chat that has form alerts on."
          enabled={telegramAlertsOn(notifications)}
          onChange={(telegramEnabled) => onChange({ telegramEnabled })}
        >
          <TelegramConnectionStatus summary={telegram.summary} failed={telegram.failed} onRetry={telegram.reload} />
        </AlertChannel>
        <Text size="xs" c="dimmed" className={classes.footnote}>
          Changes apply once you save the form. Email alerts live under Email notifications; Slack, Discord and
          Teams are set up in Connections.
        </Text>
      </Stack>
    </Modal>
  );
}

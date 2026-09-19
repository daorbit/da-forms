import { Modal, Group, Text, Switch, Divider, ActionIcon, Stack } from '@mantine/core';
import { IconX, IconBellRinging } from '@tabler/icons-react';

interface Props {
  opened: boolean;
  onClose: () => void;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

/**
 * Separate from `NotificationsModal` on purpose — that one sends email
 * through the workspace's connected mail app; this drops a row into the
 * Quantalog notification bell instead, and the two have nothing to do with
 * each other beyond both firing on a submission.
 */
export function DrawerNotifyModal({ opened, onClose, enabled, onChange }: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      padding={0}
      radius="lg"
      size="sm"
    >
      <Group gap="sm" px="lg" py="md" wrap="nowrap">
        <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose} aria-label="Close">
          <IconX size={18} />
        </ActionIcon>
        <Divider orientation="vertical" my={6} />
        <Text fw={600}>Notification drawer</Text>
      </Group>
      <Divider />
      <Stack gap="md" px="lg" py="lg">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" align="flex-start">
            <IconBellRinging size={20} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <Text size="sm" fw={600}>
                Notify in Quantalog
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                Drops a row into your Quantalog notification bell on every submission to this
                form, with the answers attached.
              </Text>
            </div>
          </Group>
          <Switch
            checked={enabled}
            onChange={(e) => onChange(e.currentTarget.checked)}
            color="emerald"
            size="md"
          />
        </Group>
      </Stack>
    </Modal>
  );
}

import { useState } from 'react';
import { Modal, Box, Group, Text, ActionIcon, Tooltip, Divider } from '@mantine/core';
import { IconX, IconRefresh } from '@tabler/icons-react';
import { AppsPanel } from './AppsPanel';

interface Props {
  opened: boolean;
  onClose: () => void;
  workspaceId: string;
  isDemo: boolean;
}

/**
 * The integrations card grid in a dialog.
 *
 * The only surface for connecting apps — opened from the forms list and from
 * the builder's icon rail. There is no dedicated route, so it can be dropped in
 * anywhere a workspace id is in hand.
 */
export function IntegrationsModal({ opened, onClose, workspaceId, isDemo }: Props) {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      transitionProps={{ transition: 'fade', duration: 150 }}
      styles={{ body: { padding: 0 } }}
    >
      <Group justify="space-between" px={{ base: 'md', sm: 'xl' }} py="md">
        <Text fw={600} size="lg">
          Integrations
        </Text>
        <Group gap="xs">
          <Tooltip label="Refresh" withArrow>
            <ActionIcon
              variant="default"
              size="input-sm"
              onClick={() => setReloadKey((k) => k + 1)}
              aria-label="Refresh"
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
          <ActionIcon variant="subtle" size="lg" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </ActionIcon>
        </Group>
      </Group>

      <Divider />

      <Box px={{ base: 'md', sm: 'xl' }} py="xl">
        <AppsPanel workspaceId={workspaceId} isDemo={isDemo} reloadKey={reloadKey} />
      </Box>
    </Modal>
  );
}

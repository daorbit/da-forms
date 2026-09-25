import { useState } from 'react';
import { Modal, Box, ActionIcon, Tooltip } from '@mantine/core';
import { PageHeader } from '@/components/ui/PageHeader';
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
      <Box px="md" py="lg">
        <PageHeader
          title="Integrations"
          description="Connect email, payments and automation once — every form in this workspace can use them."
          actions={
            <>
              <Tooltip label="Refresh" withArrow>
                <ActionIcon
                  variant="default"
                  size={36}
                  radius="md"
                  onClick={() => setReloadKey((k) => k + 1)}
                  aria-label="Refresh"
                >
                  <IconRefresh size={17} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Close" withArrow>
                <ActionIcon variant="default" size={36} radius="md" onClick={onClose} aria-label="Close">
                  <IconX size={18} />
                </ActionIcon>
              </Tooltip>
            </>
          }
        />
        <AppsPanel workspaceId={workspaceId} isDemo={isDemo} reloadKey={reloadKey} />
      </Box>
    </Modal>
  );
}

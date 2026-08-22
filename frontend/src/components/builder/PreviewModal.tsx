import { useState } from 'react';
import { Modal, Group, Text, ActionIcon, Box, Badge } from '@mantine/core';
import { IconX, IconDeviceDesktop, IconDeviceTablet, IconDeviceMobile } from '@tabler/icons-react';
import type { FormField } from '@/types';
import { FormRenderer } from '@/components/FormRenderer';
import classes from './PreviewModal.module.css';

type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICES: { id: Device; icon: typeof IconDeviceDesktop; width: number | string }[] = [
  { id: 'desktop', icon: IconDeviceDesktop, width: 680 },
  { id: 'tablet', icon: IconDeviceTablet, width: 600 },
  { id: 'mobile', icon: IconDeviceMobile, width: 390 },
];

interface Props {
  opened: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  fields: FormField[];
  hideHeader?: boolean;
}

/**
 * Shows exactly what respondents see, rendered from the editor's current
 * state — so unsaved changes are previewable without a round trip.
 */
export function PreviewModal({ opened, onClose, title, description, fields, hideHeader }: Props) {
  const [device, setDevice] = useState<Device>('desktop');
  const active = DEVICES.find((d) => d.id === device) ?? DEVICES[0];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      transitionProps={{ transition: 'fade', duration: 150 }}
      styles={{
        content: { display: 'flex', flexDirection: 'column', border: 'none' },
        body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
      }}
    >
      <Group justify="space-between" px="md" className={classes.topbar} wrap="nowrap">
        <Group gap={10} wrap="nowrap" style={{ flex: 1 }}>
          <Text fw={600} size="sm">
            {title || 'Untitled form'}
          </Text>
          <Badge variant="light" color="gray" size="sm">
            Preview
          </Badge>
        </Group>

        <Group gap={2} wrap="nowrap" className={classes.deviceGroup}>
          {DEVICES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${classes.deviceButton} ${device === item.id ? classes.deviceButtonActive : ''}`}
              onClick={() => setDevice(item.id)}
              aria-label={item.id}
              aria-pressed={device === item.id}
            >
              <item.icon size={18} stroke={1.6} />
            </button>
          ))}
        </Group>

        <Group justify="flex-end" style={{ flex: 1 }}>
          <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose} aria-label="Close">
            <IconX size={19} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Always the respondent's own colours, whatever theme the host passes. */}
      <Box className={`${classes.stage} da-forms-light-surface`} data-mantine-color-scheme="light">
        <Box className={classes.viewport} style={{ width: active.width, maxWidth: '100%' }}>
          {/* Remount per open so each preview starts from the initial values. */}
          <FormRenderer
            key={opened ? 'open' : 'closed'}
            title={title}
            description={description}
            fields={fields}
            hideHeader={hideHeader}
          />
          <Text size="xs" c="dimmed" ta="center" mt="md">
            Submissions are not recorded in preview.
          </Text>
        </Box>
      </Box>
    </Modal>
  );
}

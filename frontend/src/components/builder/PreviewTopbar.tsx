import { ActionIcon, Badge, Button, Group, Text, Tooltip } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { type DeviceId } from './DeviceFrame';
import { DeviceSwitch } from './DeviceSwitch';
import classes from './PreviewModal.module.css';

interface Props {
  title: string;
  device: DeviceId;
  onDeviceChange: (device: DeviceId) => void;
  /** Name of the preset being tried out, if any. */
  pickedName?: string;
  onApply?: () => void;
  onClose: () => void;
}

/** The preview's chrome: which device is on the stage, and what to do about it. */
export function PreviewTopbar({
  title,
  device,
  onDeviceChange,
  pickedName,
  onApply,
  onClose,
}: Props) {
  return (
    <Group justify="space-between" className={classes.topbar} wrap="nowrap">
      <Group gap={10} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
        <Text fw={600} size="sm" truncate className={classes.topbarTitle}>
          {title || 'Untitled form'}
        </Text>
        {pickedName && (
          <Badge variant="light" color="violet" size="sm">
            {pickedName}
          </Badge>
        )}
      </Group>

      <DeviceSwitch device={device} onChange={onDeviceChange} />

      <Group justify="flex-end" gap="xs" style={{ flex: 1 }} wrap="nowrap">
        {pickedName && onApply && (
          <Button size="xs" color="emerald" onClick={onApply}>
            Apply theme
          </Button>
        )}
        <Tooltip label="Close preview" withArrow>
          <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose} aria-label="Close">
            <IconX size={19} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
}

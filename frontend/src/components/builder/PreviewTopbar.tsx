import { ActionIcon, Badge, Button, Group, Text, Tooltip } from '@mantine/core';
import { IconDeviceIpad, IconDeviceLaptop, IconDeviceMobile, IconX } from '@tabler/icons-react';
import { DEVICE_ORDER, DEVICE_SPECS, type DeviceId } from './DeviceFrame';
import classes from './PreviewModal.module.css';

const DEVICE_ICONS: Record<DeviceId, typeof IconDeviceLaptop> = {
  macbook: IconDeviceLaptop,
  ipad: IconDeviceIpad,
  iphone: IconDeviceMobile,
};

interface Props {
  title: string;
  device: DeviceId;
  onDeviceChange: (device: DeviceId) => void;
  /** Current fit ratio, shown next to the device's true width. */
  scale: number;
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
  scale,
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

      <Group gap={2} wrap="nowrap" className={classes.deviceGroup}>
        {DEVICE_ORDER.map((id) => {
          const Icon = DEVICE_ICONS[id];
          return (
            <button
              key={id}
              type="button"
              className={`${classes.deviceButton} ${device === id ? classes.deviceButtonActive : ''}`}
              onClick={() => onDeviceChange(id)}
              aria-pressed={device === id}
            >
              <Icon size={17} stroke={1.6} />
              {DEVICE_SPECS[id].label}
            </button>
          );
        })}
      </Group>

      <Group justify="flex-end" gap="xs" style={{ flex: 1 }} wrap="nowrap">
        <Text size="xs" className={classes.topbarMeta} visibleFrom="md">
          {DEVICE_SPECS[device].width}px · {Math.round(scale * 100)}%
        </Text>
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

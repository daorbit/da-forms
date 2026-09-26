import { ActionIcon, Badge, Button, Group, Text, Tooltip } from '@mantine/core';
import { IconPalette, IconX } from '@tabler/icons-react';
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
  compact?: boolean;
  themesOpen?: boolean;
  onToggleThemes?: () => void;
}

/** The preview's chrome: which device is on the stage, and what to do about it. */
export function PreviewTopbar({
  title,
  device,
  onDeviceChange,
  pickedName,
  onApply,
  onClose,
  compact = false,
  themesOpen = false,
  onToggleThemes,
}: Props) {
  return (
    <Group justify="space-between" className={classes.topbar} wrap="nowrap">
      <Group gap={10} wrap="nowrap" className={classes.topbarStart}>
        <Text fw={600} size="sm" truncate className={classes.topbarTitle}>
          {title || 'Untitled form'}
        </Text>
        {pickedName && !compact && (
          <Badge variant="light" color="violet" size="sm">
            {pickedName}
          </Badge>
        )}
      </Group>

      {!compact && <DeviceSwitch device={device} onChange={onDeviceChange} />}

      <Group justify="flex-end" gap="xs" wrap="nowrap" className={classes.topbarEnd}>
        {pickedName && onApply && (
          <Button size="xs" color="emerald" onClick={onApply}>
            {compact ? 'Apply' : 'Apply theme'}
          </Button>
        )}
        {compact && onToggleThemes && (
          <Button
            size="xs"
            variant={themesOpen ? 'light' : 'default'}
            leftSection={<IconPalette size={14} />}
            onClick={onToggleThemes}
          >
            Themes
          </Button>
        )}
        <Tooltip label="Close preview" withArrow disabled={compact}>
          <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose} aria-label="Close">
            <IconX size={19} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
}

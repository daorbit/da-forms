import { ActionIcon, Divider, Group, Paper, Text, Tooltip } from '@mantine/core';
import { IconTrash, IconX, IconMail, IconMailOpened, IconFileExport } from '@tabler/icons-react';

/**
 * The floating bar that appears once at least one row is checked — a
 * snackbar-style strip anchored to the bottom of the viewport, not part of
 * the table's own layout, so it doesn't push content around as selection
 * changes.
 */
export function BulkActionBar({
  count,
  onClear,
  onDelete,
  onMarkRead,
  onMarkUnread,
  onExport,
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onExport: () => void;
}) {
  if (count === 0) return null;

  return (
    <Paper radius="xl" shadow="lg" withBorder className="bulkActionBar">
      <Group gap="sm" wrap="nowrap" px="md" py="xs">
        <Text size="sm" fw={600}>
          {count} selected
        </Text>
        <Divider orientation="vertical" />
        <Tooltip label="Mark as read" withArrow>
          <ActionIcon variant="subtle" color="gray" radius="xl" onClick={onMarkRead} aria-label="Mark selected as read">
            <IconMailOpened size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Mark as unread" withArrow>
          <ActionIcon variant="subtle" color="gray" radius="xl" onClick={onMarkUnread} aria-label="Mark selected as unread">
            <IconMail size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Export selected as CSV" withArrow>
          <ActionIcon variant="subtle" color="gray" radius="xl" onClick={onExport} aria-label="Export selected as CSV">
            <IconFileExport size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Delete selected" withArrow>
          <ActionIcon variant="light" color="red" radius="xl" onClick={onDelete} aria-label="Delete selected responses">
            <IconTrash size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Clear selection" withArrow>
          <ActionIcon variant="subtle" color="gray" radius="xl" onClick={onClear} aria-label="Clear selection">
            <IconX size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Paper>
  );
}

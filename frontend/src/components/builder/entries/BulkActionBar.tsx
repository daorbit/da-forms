import { ActionIcon, Group, Paper, Text, Tooltip } from '@mantine/core';
import { IconTrash, IconX } from '@tabler/icons-react';

/**
 * The floating bar that appears once at least one row is checked — a
 * snackbar-style strip anchored to the bottom of the viewport, not part of
 * the table's own layout, so it doesn't push content around as selection
 * changes.
 */
export function BulkActionBar({ count, onClear, onDelete }: { count: number; onClear: () => void; onDelete: () => void }) {
  if (count === 0) return null;

  return (
    <Paper radius="xl" shadow="lg" withBorder className="bulkActionBar">
      <Group gap="sm" wrap="nowrap" px="md" py="xs">
        <Text size="sm" fw={600}>
          {count} selected
        </Text>
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

import { ActionIcon, Divider, Group, Menu, Paper, Text, Tooltip } from '@mantine/core';
import { FileOutputIcon, FlagIcon, MailIcon, MailOpenIcon, Trash2Icon, XIcon } from 'lucide-react';
import type { SubmissionStage } from '@/types';
import { STAGES } from '@/lib/stages';

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
  onSetStage,
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onExport: () => void;
  onSetStage?: (stage: SubmissionStage) => void;
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
            <MailOpenIcon size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Mark as unread" withArrow>
          <ActionIcon variant="subtle" color="gray" radius="xl" onClick={onMarkUnread} aria-label="Mark selected as unread">
            <MailIcon size={16} />
          </ActionIcon>
        </Tooltip>
        {onSetStage && (
          <Menu position="top" withArrow>
            <Menu.Target>
              <Tooltip label="Move to stage" withArrow>
                <ActionIcon variant="subtle" color="gray" radius="xl" aria-label="Move selected to a stage">
                  <FlagIcon size={16} />
                </ActionIcon>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Move to stage</Menu.Label>
              {STAGES.map((stage) => (
                <Menu.Item key={stage.id} onClick={() => onSetStage(stage.id)}>
                  {stage.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        )}
        <Tooltip label="Export selected as CSV" withArrow>
          <ActionIcon variant="subtle" color="gray" radius="xl" onClick={onExport} aria-label="Export selected as CSV">
            <FileOutputIcon size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Delete selected" withArrow>
          <ActionIcon variant="light" color="red" radius="xl" onClick={onDelete} aria-label="Delete selected responses">
            <Trash2Icon size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Clear selection" withArrow>
          <ActionIcon variant="subtle" color="gray" radius="xl" onClick={onClear} aria-label="Clear selection">
            <XIcon size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Paper>
  );
}

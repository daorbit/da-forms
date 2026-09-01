import { ActionIcon, Button, Group, Skeleton, Text, TextInput, Tooltip } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconArrowLeft, IconCheck, IconPencil, IconX } from '@tabler/icons-react';
import type { Form } from '@/types';
import classes from '../../../pages/EntriesPage.module.css';

export function EntriesTopbar({
  form,
  workspaceId,
  editingName,
  nameDraft,
  savingName,
  onStartEditingName,
  onNameDraftChange,
  onSaveName,
  onCancelEditingName,
  onCopyShareLink,
}: {
  form: Form | null;
  workspaceId: string;
  editingName: boolean;
  nameDraft: string;
  savingName: boolean;
  onStartEditingName: () => void;
  onNameDraftChange: (value: string) => void;
  onSaveName: () => void;
  onCancelEditingName: () => void;
  onCopyShareLink: () => void;
}) {
  if (!form) {
    return (
      <Group justify="space-between" px="md" py="sm" className={classes.topbar} wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <Skeleton height={28} width={28} radius="sm" />
          <Skeleton height={20} width={160} radius="sm" />
        </Group>
        <Group gap="xs">
          <Skeleton height={32} width={80} radius="md" />
          <Skeleton height={32} width={110} radius="md" />
        </Group>
      </Group>
    );
  }

  return (
    <Group justify="space-between" px="md" py="sm" className={classes.topbar} wrap="nowrap">
      <Group gap="xs" wrap="nowrap">
        <ActionIcon component={Link} to={`/${workspaceId}/forms`} variant="subtle" color="gray" size="lg" aria-label="Back to all forms">
          <IconArrowLeft size={19} />
        </ActionIcon>

        {editingName ? (
          <Group gap={4} wrap="nowrap">
            <TextInput
              value={nameDraft}
              onChange={(e) => onNameDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveName();
                if (e.key === 'Escape') onCancelEditingName();
              }}
              size="sm"
              autoFocus
              disabled={savingName}
            />
            <ActionIcon variant="subtle" color="emerald" size="lg" aria-label="Save name" onClick={onSaveName} loading={savingName}>
              <IconCheck size={16} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Cancel" onClick={onCancelEditingName} disabled={savingName}>
              <IconX size={16} />
            </ActionIcon>
          </Group>
        ) : (
          <Group gap={4} wrap="nowrap">
            <Text fw={600} component={Link} to={`/${workspaceId}/forms/${form._id}/edit`} className={classes.formLink}>
              {form.name || form.title}
            </Text>
            <Tooltip label="Rename form" withArrow>
              <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Rename form" onClick={onStartEditingName}>
                <IconPencil size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      </Group>
      <Group gap="xs">
        <Button variant="default" radius="md" color="emerald" onClick={onCopyShareLink}>
          Share
        </Button>
        <Button
          component={Link}
          to={`/${workspaceId}/forms/${form._id}/edit`}
          color="emerald"
          radius="md"
          leftSection={<IconPencil size={16} />}
        >
          Edit
        </Button>
      </Group>
    </Group>
  );
}

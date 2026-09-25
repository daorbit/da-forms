import { ActionIcon, Button, Group, Skeleton, TextInput, Tooltip } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconArrowLeft, IconCheck, IconLink, IconPencil, IconX } from '@tabler/icons-react';
import { StatusPill } from '@/components/ui/StatusPill';
import { PageHeader } from '@/components/ui/PageHeader';
import { BookOpen } from 'lucide-react';
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
  total,
}: {
  total?: number;
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
      <Group justify="space-between" mb="xl" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <Skeleton height={36} width={36} radius="md" />
          <div>
            <Skeleton height={28} width={220} radius="sm" />
            <Skeleton height={12} width={160} radius="sm" mt={10} />
          </div>
        </Group>
        <Group gap="xs">
          <Skeleton height={32} width={80} radius="md" />
          <Skeleton height={32} width={110} radius="md" />
        </Group>
      </Group>
    );
  }

  const back = (
    <ActionIcon
      component={Link}
      to={`/${workspaceId}/forms`}
      variant="default"
      size={36}
      radius="md"
      mt={2}
      aria-label="Back to all forms"
    >
      <IconArrowLeft size={18} />
    </ActionIcon>
  );

  return (
    <PageHeader
      leading={back}
      title={
        editingName ? (
          <Group gap={4} wrap="nowrap" component="span">
            <TextInput
              value={nameDraft}
              onChange={(e) => onNameDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveName();
                if (e.key === 'Escape') onCancelEditingName();
              }}
              size="md"
              autoFocus
              disabled={savingName}
            />
            <ActionIcon variant="subtle" size="lg" aria-label="Save name" onClick={onSaveName} loading={savingName}>
              <IconCheck size={16} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Cancel" onClick={onCancelEditingName} disabled={savingName}>
              <IconX size={16} />
            </ActionIcon>
          </Group>
        ) : (
          <Group gap={8} wrap="nowrap" component="span" className={classes.titleRow}>
            <span className={classes.titleText}>{form.name || form.title}</span>
            <Tooltip label="Rename form" withArrow>
              <ActionIcon variant="subtle" color="gray" size="md" aria-label="Rename form" onClick={onStartEditingName}>
                <IconPencil size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )
      }
      description={
        <Group gap={8} component="span" wrap="nowrap">
          <StatusPill
            tone={form.status === 'published' ? 'live' : 'idle'}
            label={form.status === 'published' ? 'Live' : 'Draft'}
          />
          <span>
            {total !== undefined
              ? `${total.toLocaleString()} ${total === 1 ? 'response' : 'responses'} collected`
              : 'Responses to this form'}
          </span>
        </Group>
      }
      actions={
        <>
          <Button component={Link} to={`/${workspaceId}/forms/${form._id}/edit`} leftSection={<IconPencil size={16} />}>
            Edit form
          </Button>
          <Button variant="default" leftSection={<IconLink size={16} />} onClick={onCopyShareLink}>
            Copy link
          </Button>
          <Tooltip label="Docs">
            <ActionIcon
              component="a"
              href="https://quantalog.daorbit.in/docs/forms-entries-and-links"
              target="_blank"
              rel="noopener noreferrer"
              variant="default"
              size={36}
              radius="xl"
              aria-label="Docs"
            >
              <BookOpen size={17} />
            </ActionIcon>
          </Tooltip>
        </>
      }
    />
  );
}

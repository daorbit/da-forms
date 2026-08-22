import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Group, Text, Button, Stack, ActionIcon, ThemeIcon, Menu, Modal } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconSearch,
  IconArrowsSort,
  IconChevronDown,
  IconFileText,
  IconPencil,
  IconGridDots,
  IconShare2,
  IconDots,
  IconTrash,
  IconCopy,
  IconExternalLink,
} from '@tabler/icons-react';
import { listForms, deleteForm } from '@/lib/api';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import type { Form } from '@/types';
import { NewFormModal } from '@/components/NewFormModal';
import { ShareModal } from '@/components/share/ShareModal';
import classes from './FormListPage.module.css';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function FormListPage() {
  const workspaceId = useWorkspaceId();
  const [forms, setForms] = useState<Form[]>([]);
  const [newFormOpen, setNewFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Form | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState<Form | null>(null);

  useEffect(() => {
    listForms(workspaceId).then(setForms);
  }, [workspaceId]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    await deleteForm(pendingDelete._id, workspaceId);
    setForms((prev) => prev.filter((f) => f._id !== pendingDelete._id));
    setDeleting(false);
    setPendingDelete(null);
    notifications.show({ message: 'Form deleted', color: 'emerald' });
  }

  return (
    <Box>
      <Group justify="space-between" px="xl" py="md" className={classes.topbar}>
        <Group gap={6}>
          <Text fw={600} size="lg">
            All Forms
          </Text>
          <IconChevronDown size={16} />
        </Group>
        <Group gap="xs">
          <ActionIcon variant="subtle" color="gray" radius="xl" size="lg">
            <IconSearch size={18} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" radius="xl" size="lg">
            <IconArrowsSort size={18} />
          </ActionIcon>
          <Button
            radius="xl"
            color="emerald"
            leftSection={<IconPlus size={16} />}
            onClick={() => setNewFormOpen(true)}
          >
            New Form
          </Button>
        </Group>
      </Group>

      <Stack gap="xs" px="xl" py="md">
        {forms.length === 0 && (
          <Text c="dimmed" ta="center" py="xl">
            No forms yet. Create your first one.
          </Text>
        )}

        {forms.map((form) => (
          <Box key={form._id} className={classes.row}>
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon variant="light" color="gray" radius="md" size={38}>
                  <IconFileText size={20} />
                </ThemeIcon>
                <div>
                  <Link to={`/${workspaceId}/forms/${form._id}/edit`} className={classes.title}>
                    {form.title}
                  </Link>
                  <Group gap={6}>
                    <Text size="sm" c="dimmed">
                      Created on: {formatDate(form.createdAt)}
                    </Text>
                    <Text size="sm" c="dimmed">
                      &bull;
                    </Text>
                    <Text size="sm" c={form.status === 'published' ? 'emerald' : 'dimmed'}>
                      {form.status}
                    </Text>
                  </Group>
                </div>
              </Group>

              <Group gap="xs" wrap="nowrap">
                <Button
                  component={Link}
                  to={`/${workspaceId}/forms/${form._id}/edit`}
                  variant="default"
                  radius="xl"
                  size="xs"
                  leftSection={<IconPencil size={14} />}
                >
                  Edit
                </Button>
                <Button
                  component={Link}
                  to={`/${workspaceId}/forms/${form._id}/entries`}
                  variant="default"
                  radius="xl"
                  size="xs"
                  leftSection={<IconGridDots size={14} />}
                >
                  All Entries
                </Button>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  radius="xl"
                  size="lg"
                  onClick={() => setSharing(form)}
                  aria-label="Share"
                >
                  <IconShare2 size={16} />
                </ActionIcon>

                <Menu shadow="md" position="bottom-end" width={200}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray" radius="xl" size="lg">
                      <IconDots size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      component="a"
                      href={`/f/${form._id}`}
                      target="_blank"
                      leftSection={<IconExternalLink size={15} />}
                    >
                      Open live form
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconCopy size={15} />}
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/f/${form._id}`);
                        notifications.show({ message: 'Link copied', color: 'emerald' });
                      }}
                    >
                      Copy link
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<IconTrash size={15} />}
                      onClick={() => setPendingDelete(form)}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>
          </Box>
        ))}
      </Stack>

      <NewFormModal opened={newFormOpen} onClose={() => setNewFormOpen(false)} />

      {sharing && (
        <ShareModal
          opened
          onClose={() => setSharing(null)}
          form={sharing}
          onStatusChange={(status) =>
            setForms((prev) => prev.map((f) => (f._id === sharing._id ? { ...f, status } : f)))
          }
        />
      )}

      <Modal
        opened={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete form"
        centered
      >
        <Text size="sm">
          Delete <strong>{pendingDelete?.title}</strong>? Its submissions stay in the database but the
          form and its public link stop working.
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" radius="xl" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button color="red" radius="xl" loading={deleting} onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}

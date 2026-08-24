import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box, Group, Text, Button, Stack, ActionIcon, ThemeIcon, Menu, Modal, Tooltip, TextInput, Pagination, Skeleton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconSearch,
  IconArrowsSort,
  IconFileText,
  IconPencil,
  IconGridDots,
  IconShare2,
  IconDots,
  IconTrash,
  IconCopy,
  IconCopyPlus,
  IconExternalLink,
  IconRefresh,
  IconEyeOff,
  IconWorldUpload,
  IconX,
} from '@tabler/icons-react';
import { listForms, deleteForm, updateForm, createForm, publicFormPath, publicFormUrl, type WorkspaceStats } from '@/lib/api';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { useDebouncedValue } from '@mantine/hooks';
import type { Form } from '@/types';
import { NewFormModal } from '@/components/NewFormModal';
import { ShareModal } from '@/components/share/ShareModal';
import { WorkspaceStatsBar } from '@/components/builder/WorkspaceStatsBar';
import { cloneWithNewIds } from '@/lib/fieldTree';
import classes from './FormListPage.module.css';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type SortOption = 'date' | 'dateAsc' | 'name' | 'nameDesc' | 'status';

const SORT_LABEL: Record<SortOption, string> = {
  date: 'Newest first',
  dateAsc: 'Oldest first',
  name: 'Name (A-Z)',
  nameDesc: 'Name (Z-A)',
  status: 'Status',
};

const PAGE_SIZE = 10;

export function FormListPage() {
  const workspaceId = useWorkspaceId();
  const location = useLocation();
  const [forms, setForms] = useState<Form[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [sort, setSort] = useState<SortOption>('date');
  const [loading, setLoading] = useState(true);
  const [newFormOpen, setNewFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Form | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState<Form | null>(null);
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    return listForms(workspaceId, { page, limit: PAGE_SIZE, q: debouncedSearch, sort })
      .then((res) => {
        setForms(res.items);
        setTotal(res.total);
        setStats(res.stats);
      })
      .finally(() => setLoading(false));
  }, [workspaceId, page, debouncedSearch, sort]);

  // Keyed on the location as well as the loader, so returning from the builder
  // refetches rather than showing the list as it was before the edit — however
  // the page is reached, our own link or the browser's back button.
  useEffect(() => {
    load();
  }, [location.key, load]);

  // A new search or sort narrows/reorders the result set, so paging resets to
  // the top rather than landing on a page that may no longer exist.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sort]);

  useEffect(() => {
    if (!searchOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [searchOpen]);

  async function toggleStatus(form: Form) {
    const status = form.status === 'published' ? 'draft' : 'published';
    const updated = await updateForm(form._id, { status }, workspaceId);
    setForms((prev) => prev.map((f) => (f._id === form._id ? updated : f)));
    notifications.show({
      message: status === 'published' ? 'Form published' : 'Form moved back to draft',
      color: status === 'published' ? 'emerald' : 'gray',
    });
  }

  async function duplicateForm(form: Form) {
    setDuplicatingId(form._id);
    try {
      // Fresh ids throughout — same reason the field-level duplicate needs
      // them: two fields (here, two forms) sharing an id would be addressed
      // together by every future edit.
      const fields = form.fields.map(cloneWithNewIds);
      await createForm(
        {
          name: `${form.name} (copy)`,
          title: form.title,
          description: form.description,
          fields,
          redirectUrl: form.redirectUrl,
          thankYouMessage: form.thankYouMessage,
          hideHeader: form.hideHeader,
          labelPlacement: form.labelPlacement,
          submitLabel: form.submitLabel,
          submitButtonSize: form.submitButtonSize,
          submitButtonWidth: form.submitButtonWidth,
          theme: form.theme,
          collectIp: form.collectIp,
        },
        workspaceId
      );
      notifications.show({ message: 'Form duplicated', color: 'emerald' });
      load();
    } finally {
      setDuplicatingId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    await deleteForm(pendingDelete._id, workspaceId);
    setDeleting(false);
    setPendingDelete(null);
    notifications.show({ message: 'Form deleted', color: 'emerald' });
    load();
  }

  return (
    <Box>
      <Group justify="space-between" px="xl" py="md" className={classes.topbar}>
        <Text fw={600} size="lg">
          Leads Capture
        </Text>
        <Group gap="xs">
          <div ref={searchRef}>
            {searchOpen ? (
              <TextInput
                placeholder="Search forms"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftSection={<IconSearch size={16} />}
                rightSection={
                  search ? (
                    <ActionIcon variant="subtle" color="gray" onClick={() => setSearch('')} aria-label="Clear search">
                      <IconX size={14} />
                    </ActionIcon>
                  ) : undefined
                }
                radius="xl"
                size="sm"
                w={220}
                autoFocus
              />
            ) : (
              <Tooltip label="Search forms" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  radius="xl"
                  size="lg"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search forms"
                >
                  <IconSearch size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </div>
          <Menu shadow="md" width={180}>
            <Menu.Target>
              <Tooltip label="Sort" withArrow>
                <ActionIcon variant="subtle" color="gray" radius="xl" size="lg" aria-label="Sort">
                  <IconArrowsSort size={18} />
                </ActionIcon>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              {(Object.keys(SORT_LABEL) as SortOption[]).map((key) => (
                <Menu.Item key={key} onClick={() => setSort(key)} fw={sort === key ? 700 : 400}>
                  {SORT_LABEL[key]}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
          <Tooltip label="Refresh" withArrow>
            <ActionIcon
              variant="subtle"
              radius="xl"
              color="gray"
             
              size="lg"
              onClick={() => load()}
              loading={loading}
              aria-label="Refresh"
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
          <Button
           
            color="emerald"
            leftSection={<IconPlus size={16} />}
            onClick={() => setNewFormOpen(true)}
          >
            New Form
          </Button>
        </Group>
      </Group>

      <WorkspaceStatsBar stats={stats} />

      <Stack gap="xs" px="xl" py="md">
        {loading && forms.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} className={classes.row}>
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
                  <Skeleton height={38} width={38} radius="md" />
                  <Stack gap={6} style={{ flex: 1, maxWidth: 320 }}>
                    <Skeleton height={14} width="60%" />
                    <Skeleton height={10} width="35%" />
                  </Stack>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <Skeleton height={28} width={70} radius="sm" />
                  <Skeleton height={28} width={90} radius="sm" />
                  <Skeleton height={28} width={28} radius="xl" />
                  <Skeleton height={28} width={28} radius="xl" />
                </Group>
              </Group>
            </Box>
          ))
        ) : null}

        {forms.length === 0 && !loading && (
          <Stack align="center" justify="center" gap={0} className={classes.emptyState}>
            <div className={classes.emptyIcon} aria-hidden>
              <IconFileText size={38} stroke={1.25} />
            </div>
            <Text fw={650} fz="lg" mt="lg">
              {debouncedSearch ? 'No forms match your search' : 'No forms yet'}
            </Text>
            <Text size="sm" c="dimmed" mt={6} className={classes.emptyText}>
              {debouncedSearch
                ? 'Try a different search term.'
                : 'Build a form to collect leads, then share its link or embed it on your site.'}
            </Text>
            <Button
              mt="xl"
              size="md"
             
              leftSection={<IconPlus size={16} />}
              onClick={() => setNewFormOpen(true)}
            >
              Create your first form
            </Button>
          </Stack>
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
                    {form.name}
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
                 
                  size="xs"
                  leftSection={<IconPencil size={14} />}
                >
                  Edit
                </Button>
                <Button
                  component={Link}
                  to={`/${workspaceId}/forms/${form._id}/entries`}
                  variant="default"
                 
                  size="xs"
                  leftSection={<IconGridDots size={14} />}
                >
                  All Entries
                </Button>
                <ActionIcon
                  variant="subtle"
                  radius="xl"
                  color="gray"
                 
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
                      leftSection={
                        form.status === 'published' ? (
                          <IconEyeOff size={15} />
                        ) : (
                          <IconWorldUpload size={15} />
                        )
                      }
                      onClick={() => toggleStatus(form)}
                    >
                      {form.status === 'published' ? 'Unpublish' : 'Publish'}
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      component="a"
                      href={publicFormPath(form._id)}
                      target="_blank"
                      leftSection={<IconExternalLink size={15} />}
                    >
                      Open live form
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconCopy size={15} />}
                      onClick={() => {
                        navigator.clipboard.writeText(publicFormUrl(form._id));
                        notifications.show({ message: 'Link copied', color: 'emerald' });
                      }}
                    >
                      Copy link
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      leftSection={<IconCopyPlus size={15} />}
                      disabled={duplicatingId === form._id}
                      onClick={() => duplicateForm(form)}
                    >
                      Duplicate
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

      {total > 0 && (
        <Group justify="flex-end" px="xl" py="md">
          <Pagination
            total={Math.max(1, Math.ceil(total / PAGE_SIZE))}
            value={page}
            onChange={setPage}
            color="emerald"
            disabled={total <= PAGE_SIZE}
          />
        </Group>
      )}

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
          Delete <strong>{pendingDelete?.name}</strong>? Its submissions stay in the database but the
          form and its public link stop working.
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button color="red" loading={deleting} onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}

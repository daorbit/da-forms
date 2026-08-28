import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box, Group, Text, Button, Stack, ActionIcon, ThemeIcon, Menu, Modal, Tooltip, TextInput, Pagination, Skeleton, SegmentedControl, Alert, Badge,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
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
  IconEye,
  IconEyeOff,
  IconWorldUpload,
  IconX,
  IconInfoCircle,
} from '@tabler/icons-react';
import { listForms, deleteForm, updateForm, createForm, publicFormPath, publicFormUrl } from '@/lib/api';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { isDemoWorkspace, listDemoForms } from '@/lib/demoWorkspace';
import { useDebouncedValue } from '@mantine/hooks';
import type { Form, FormTheme } from '@/types';
import { NewFormModal } from '@/components/NewFormModal';
import { ShareModal } from '@/components/share/ShareModal';
import { PreviewModal } from '@/components/builder/PreviewModal';
import { cloneWithNewIds } from '@/lib/fieldTree';
import classes from './FormListPage.module.css';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type SortOption = 'date' | 'dateAsc' | 'name' | 'nameDesc' | 'status';

/** Filtered on the server — see `listForms`, which pages the result set. */
type StatusFilter = 'all' | 'published' | 'draft';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Live' },
  { value: 'draft', label: 'Drafts' },
];

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
  const isDemo = isDemoWorkspace(workspaceId);
  const location = useLocation();
  const [forms, setForms] = useState<Form[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [sort, setSort] = useState<SortOption>('date');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [newFormOpen, setNewFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Form | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState<Form | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<Form | null>(null);

  /**
   * Whether the row has folded its buttons into the overflow menu.
   *
   * The same 640px the stylesheet's container query uses, measured in JS
   * because the menu's dropdown renders in a portal at the document root:
   * outside this element, the container query can never match it, so the
   * duplicated items showed on every width — including desktop, next to the
   * very buttons they stand in for.
   */
  const { ref: pageRef, width: pageWidth } = useElementSize();
  const narrowRow = pageWidth > 0 && pageWidth <= 640;

  /**
   * The filters as one value, so a change to any of them is a single update.
   *
   * Page lives in here rather than in its own state because a new search, sort
   * or status has to reset it — and doing that in a separate effect meant two
   * renders with two different `page` values, which fired the list request
   * twice for one interaction.
   */
  const setFilter = (patch: Partial<{ q: string; sort: SortOption; status: StatusFilter }>) => {
    setSearch(patch.q ?? search);
    if (patch.sort) setSort(patch.sort);
    if (patch.status) setStatus(patch.status);
    setPage(1);
  };

  const load = useCallback(() => {
    // The demo workspace's forms are built into the app, not stored — there is
    // nothing to fetch, and nothing a visitor does here changes them.
    if (isDemo) {
      const res = listDemoForms({
        page,
        limit: PAGE_SIZE,
        q: debouncedSearch,
        sort,
        status: status === 'all' ? undefined : status,
      });
      setForms(res.items);
      setTotal(res.total);
      setLoading(false);
      return Promise.resolve();
    }
    setLoading(true);
    return listForms(workspaceId, {
      page,
      limit: PAGE_SIZE,
      q: debouncedSearch,
      sort,
      status: status === 'all' ? undefined : status,
    })
      .then((res) => {
        setForms(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [isDemo, workspaceId, page, debouncedSearch, sort, status]);

  // Keyed on the location as well as the loader, so returning from the builder
  // refetches rather than showing the list as it was before the edit — however
  // the page is reached, our own link or the browser's back button.
  useEffect(() => {
    load();
  }, [location.key, load]);

  const isFiltered = debouncedSearch !== '' || status !== 'all';

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

  // Applying a preset from the list has no builder state to land in, so it is
  // saved straight away — the preview then keeps showing the saved theme.
  async function applyTheme(form: Form, patch: Partial<FormTheme>) {
    const theme = { ...form.theme, ...patch, scope: form.theme?.scope ?? 'page' } as FormTheme;
    const updated = await updateForm(form._id, { theme }, workspaceId);
    setForms((prev) => prev.map((f) => (f._id === form._id ? updated : f)));
    setPreviewing(updated);
    notifications.show({ message: 'Theme applied', color: 'emerald' });
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
    <Box className={classes.page} ref={pageRef}>
      <Group justify="space-between" px={{ base: "md", sm: "xl" }} py="md" className={classes.topbar}>
        <Group gap="sm">
          <Text fw={600} size="lg">
            Leads Capture
          </Text>
          {isDemo && (
            <Badge color="gray" variant="light" radius="sm">
              Demo workspace
            </Badge>
          )}
        </Group>
        {isDemo ? (
          <Tooltip label="Creating forms is disabled in the demo workspace" withArrow>
            {/* Wrapped: a disabled Mantine button fires no pointer events, so
                the tooltip would never open on the button itself. */}
            <span>
              <Button color="emerald" leftSection={<IconPlus size={16} />} disabled>
                New Form
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Button
            color="emerald"
            leftSection={<IconPlus size={16} />}
            onClick={() => setNewFormOpen(true)}
          >
            New Form
          </Button>
        )}
      </Group>

      {isDemo && (
        <Alert color="blue" variant="light" radius={0} icon={<IconInfoCircle size={18} />}>
          <Text fw={600} size="sm">
            You are looking at sample forms
          </Text>
          <Text size="sm" mt={4}>
            This workspace is a read-only tour of the builder while it is in testing. Open any form
            to explore the editor, themes and preview — nothing you change here is saved, and new
            forms cannot be created. Real forms live in your own workspace.
          </Text>
        </Alert>
      )}

      {/* Search, filter and sort sit with the list they act on rather than in
          the header — the header holds the page's identity and the one action
          that creates something. */}
      <Group
        justify="space-between"
        gap="sm"
        px={{ base: "md", sm: "xl" }}
        pt="xl"
        wrap="wrap"
        className={classes.toolbar}
      >
        <Group gap="sm" wrap="wrap" className={classes.toolbarPrimary}>
          <TextInput
            placeholder="Search forms"
            value={search}
            onChange={(e) => setFilter({ q: e.target.value })}
            leftSection={<IconSearch size={15} className={classes.searchIcon} />}
            rightSection={
              search ? (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => setFilter({ q: '' })}
                  aria-label="Clear search"
                >
                  <IconX size={14} />
                </ActionIcon>
              ) : undefined
            }
            size="sm"
            className={classes.search}
            classNames={{ wrapper: classes.searchInput }}
          />
          <SegmentedControl
            value={status}
            onChange={(value) => setFilter({ status: value as StatusFilter })}
            data={STATUS_TABS}
            size="sm"
            className={classes.statusTabs}
          />
        </Group>

        <Group gap="xs" wrap="nowrap">
          <Menu shadow="md" width={180} position="bottom-end">
            <Menu.Target>
              <Button
                variant="default"
                size="sm"
                leftSection={<IconArrowsSort size={15} />}
              >
                {SORT_LABEL[sort]}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              {(Object.keys(SORT_LABEL) as SortOption[]).map((key) => (
                <Menu.Item key={key} onClick={() => setFilter({ sort: key })} fw={sort === key ? 700 : 400}>
                  {SORT_LABEL[key]}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
          <Tooltip label="Refresh" withArrow>
            <ActionIcon
              variant="default"
              size="input-sm"
              onClick={() => load()}
              loading={loading}
              aria-label="Refresh"
            >
              <IconRefresh size={17} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Stack gap="xs" px={{ base: "md", sm: "xl" }} py="md">
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
            {/* A filtered empty list is not an empty workspace — offering
                "create your first form" to someone whose only form is a draft
                they filtered out would be wrong. */}
            <Text fw={650} fz="lg" mt="lg">
              {isFiltered ? 'No forms match these filters' : 'No forms yet'}
            </Text>
            <Text size="sm" c="dimmed" mt={6} className={classes.emptyText}>
              {isFiltered
                ? 'Try a different search term or status.'
                : 'Build a form to collect leads, then share its link or embed it on your site.'}
            </Text>
            {isFiltered ? (
              <Button
                mt="xl"
                size="md"
                variant="default"
                onClick={() => {
                  setFilter({ q: '', status: 'all' });
                }}
              >
                Clear filters
              </Button>
            ) : (
              !isDemo && (
                <Button
                  mt="xl"
                  size="md"
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setNewFormOpen(true)}
                >
                  Create your first form
                </Button>
              )
            )}
          </Stack>
        )}

        {forms.map((form) => (
          <Box key={form._id} className={classes.row}>
            <Group justify="space-between" wrap="wrap" className={classes.rowInner}>
              <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                <ThemeIcon variant="light" color="gray" radius="md" size={38}>
                  <IconFileText size={20} />
                </ThemeIcon>
                <div style={{ minWidth: 0 }}>
                  <Link to={`/${workspaceId}/forms/${form._id}/edit`} className={classes.title}>
                    {form.name || form.title}
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

              <Group gap="xs" className={classes.rowActions}>
                <Button
                  component={Link}
                  to={`/${workspaceId}/forms/${form._id}/edit`}
                  variant="default"
                  size="xs"
                  leftSection={<IconPencil size={14} />}
                  className={classes.editBtn}
                >
                  {isDemo ? 'Open in editor' : 'Edit'}
                </Button>
                {/* Entries and Preview show as buttons on a wide row and fold
                    into the menu on a narrow one — see `.secondaryBtn`. A
                    sample form has no submissions, so its entries link is left
                    out entirely. */}
                {!isDemo && (
                  <Button
                    component={Link}
                    to={`/${workspaceId}/forms/${form._id}/entries`}
                    variant="default"
                    size="xs"
                    leftSection={<IconGridDots size={14} />}
                    className={classes.secondaryBtn}
                  >
                    All Entries
                  </Button>
                )}
                <Button
                  variant="default"
                  size="xs"
                  leftSection={<IconEye size={14} />}
                  onClick={() => setPreviewing(form)}
                  className={classes.secondaryBtn}
                >
                  Preview
                </Button>
                {!isDemo && (
                  <ActionIcon
                    variant="subtle"
                    radius="xl"
                    color="gray"
                    size="lg"
                    onClick={() => setSharing(form)}
                    aria-label="Share"
                    className={classes.shareBtn}
                  >
                    <IconShare2 size={16} />
                  </ActionIcon>
                )}

                {!isDemo && (
                <Menu shadow="md" position="bottom-end" width={200}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray" radius="xl" size="lg">
                      <IconDots size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {/* Only on the narrow layout, which hides the row buttons
                        these stand in for. On a wide row they would repeat
                        controls sitting inches away. */}
                    {narrowRow && (
                      <>
                        <Menu.Item
                          component={Link}
                          to={`/${workspaceId}/forms/${form._id}/entries`}
                          leftSection={<IconGridDots size={15} />}
                        >
                          All Entries
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconEye size={15} />}
                          onClick={() => setPreviewing(form)}
                        >
                          Preview
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconShare2 size={15} />}
                          onClick={() => setSharing(form)}
                        >
                          Share
                        </Menu.Item>
                        <Menu.Divider />
                      </>
                    )}
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
                )}
              </Group>
            </Group>
          </Box>
        ))}
      </Stack>

      {total > 0 && (
        <Group justify="flex-end" px={{ base: "md", sm: "xl" }} py="md">
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

      {previewing && (
        <PreviewModal
          opened
          onClose={() => setPreviewing(null)}
          title={previewing.title}
          description={previewing.description}
          fields={previewing.fields}
          hideHeader={previewing.hideHeader}
          headerAlign={previewing.headerAlign}
          labelPlacement={previewing.labelPlacement}
          submitLabel={previewing.submitLabel}
          submitButtonSize={previewing.submitButtonSize}
          submitButtonWidth={previewing.submitButtonWidth}
          submitButtonAlign={previewing.submitButtonAlign}
          theme={previewing.theme}
          steps={previewing.steps}
          stepIndicator={previewing.stepIndicator}
          showStepHeadings={previewing.showStepHeadings}
          // Applying a preset saves it, which the demo workspace cannot do —
          // the preview stays a preview there.
          onApplyTheme={isDemo ? undefined : (patch) => applyTheme(previewing, patch)}
        />
      )}

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
        radius="lg"
      >
        <Text size="sm">
          Delete <strong>{pendingDelete?.name || pendingDelete?.title}</strong>? Its submissions stay in the database but the
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

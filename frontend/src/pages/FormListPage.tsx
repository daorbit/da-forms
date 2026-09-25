import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Group, Text, Button, Stack, ActionIcon, Menu, Card, ThemeIcon, Modal, Tooltip, TextInput, Pagination, Skeleton, SegmentedControl, Alert, Badge,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconSearch,
  IconArrowsSort,
  IconFileText,
  IconPencil,
  IconShare2,
  IconDots,
  IconTrash,
  IconCopy,
  IconCopyPlus,
  IconClipboardCopy,
  IconExternalLink,
  IconRefresh,
  IconEye,
  IconEyeOff,
  IconWorldUpload,
  IconX,
  IconInfoCircle,
  IconPlugConnected,
  IconInbox,
  IconCheck,
} from '@tabler/icons-react';
import { BookOpen } from 'lucide-react';
import { IS_EMBEDDED } from '@/lib/bootParams';
import { HostNotificationsBell } from '@/components/HostNotificationsBell';
import {
  listForms,
  deleteForm,
  updateForm,
  duplicateForm as duplicateFormApi,
  exportFormConfig,
  publicFormPath,
  publicFormUrl,
} from '@/lib/api';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { isDemoWorkspace, listDemoForms } from '@/lib/demoWorkspace';
import { useDebouncedValue } from '@mantine/hooks';
import type { Form, FormTheme } from '@/types';
import { NewFormModal } from '@/components/NewFormModal';
import { ShareModal } from '@/components/share/ShareModal';
import { PreviewModal } from '@/components/builder/PreviewModal';
import { IntegrationsModal } from '@/components/apps/IntegrationsModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { relativeTime } from '@/lib/relativeTime';
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
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [sort, setSort] = useState<SortOption>('date');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [newFormOpen, setNewFormOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Form | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState<Form | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [copyingConfigId, setCopyingConfigId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<Form | null>(null);

  function startCreate() {
    setNewFormOpen(true);
  }

  const { ref: pageRef, width: pageWidth } = useElementSize();
  const narrowRow = pageWidth > 0 && pageWidth <= 640;


  const setFilter = (patch: Partial<{ q: string; sort: SortOption; status: StatusFilter }>) => {
    setSearch(patch.q ?? search);
    if (patch.sort) setSort(patch.sort);
    if (patch.status) setStatus(patch.status);
    setPage(1);
  };

  const load = useCallback(() => {

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
      await duplicateFormApi(form._id, workspaceId);
      notifications.show({ message: 'Form duplicated', color: 'emerald' });
      load();
    } finally {
      setDuplicatingId(null);
    }
  }


  async function copyConfig(form: Form) {
    setCopyingConfigId(form._id);
    try {
      const config = await exportFormConfig(form._id, workspaceId);
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      notifications.show({
        message: 'Config copied — paste it into another workspace',
        color: 'emerald',
      });
    } catch {
      notifications.show({ message: 'Could not copy the config', color: 'red' });
    } finally {
      setCopyingConfigId(null);
    }
  }

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

  const conversion = (views?: number, responses?: number) =>
    views && responses !== undefined ? `${Math.round((responses / views) * 100)}%` : '—';

  return (
    <Box className={classes.page} ref={pageRef} px="md" py="lg">
      <PageHeader
        title={
          <Group gap="sm" wrap="nowrap" component="span">
            Lead capture
            {isDemo && (
              <Badge color="gray" variant="light" radius="sm">
                Demo workspace
              </Badge>
            )}
          </Group>
        }
        description="Build forms, collect responses, and send them where your team works."
        actions={
          <>
            {isDemo ? (
              <Tooltip label="Creating forms is disabled in the demo workspace" withArrow>
                {/* Wrapped: a disabled Mantine button fires no pointer events, so
                    the tooltip would never open on the button itself. */}
                <span>
                  <Button leftSection={<IconPlus size={16} />} disabled>
                    New form
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Button leftSection={<IconPlus size={16} />} onClick={startCreate}>
                New form
              </Button>
            )}
            <Button
              variant="default"
              leftSection={<IconPlugConnected size={16} />}
              onClick={() => setIntegrationsOpen(true)}
            >
              Integrations
            </Button>
            <Tooltip label="Docs">
              <ActionIcon
                component="a"
                href="https://quantalog.daorbit.in/docs/lead-capture"
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
            {IS_EMBEDDED && <HostNotificationsBell />}
          </>
        }
      />

      {isDemo && (
        <Alert color="blue" variant="light" mb="xl" icon={<IconInfoCircle size={18} />}>
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

      <Stack gap="xl">
        <div>
          {/* Search, filter and sort sit with the list they act on. */}
          <Group justify="space-between" gap="sm" mb="sm" wrap="wrap" className={classes.toolbar}>
            <Group gap="sm" wrap="wrap" className={classes.toolbarPrimary}>
              <Text fw={600} size="sm" className={classes.sectionTitle}>
                Forms
              </Text>
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
                style={narrowRow ? { width: '100%' } : undefined}
              />
              <SegmentedControl
                value={status}
                onChange={(value) => setFilter({ status: value as StatusFilter })}
                data={STATUS_TABS}
                size="sm"
                fullWidth={narrowRow}
                style={narrowRow ? { width: '100%' } : undefined}
              />
            </Group>

            <Group gap="xs" wrap="nowrap">
              <Menu shadow="md" width={180} position="bottom-end">
                <Menu.Target>
                  <Button variant="default" size="sm" leftSection={<IconArrowsSort size={15} />}>
                    {SORT_LABEL[sort]}
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  {(Object.keys(SORT_LABEL) as SortOption[]).map((key) => (
                    <Menu.Item
                      key={key}
                      onClick={() => setFilter({ sort: key })}
                      rightSection={sort === key ? <IconCheck size={14} /> : undefined}
                    >
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

          {forms.length === 0 && !loading ? (
            <Stack align="center" justify="center" gap={0} className={classes.emptyState}>
              <div className={classes.emptyIcon} aria-hidden>
                <IconFileText size={36} stroke={1.25} />
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
                <Button mt="xl" size="md" variant="default" onClick={() => setFilter({ q: '', status: 'all' })}>
                  Clear filters
                </Button>
              ) : (
                !isDemo && (
                  <Button mt="xl" size="md" leftSection={<IconPlus size={16} />} onClick={startCreate}>
                    Create your first form
                  </Button>
                )
              )}
            </Stack>
          ) : (
            <Stack gap="xs">
              {loading && forms.length === 0
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} withBorder radius="md" padding="sm">
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
                          <Skeleton height={40} width={40} radius="md" />
                          <Stack gap={6} style={{ flex: 1, maxWidth: 300 }}>
                            <Skeleton height={13} width="60%" />
                            <Skeleton height={10} width="40%" />
                          </Stack>
                        </Group>
                        <Skeleton height={28} width={180} radius="md" />
                      </Group>
                    </Card>
                  ))
                : null}

              {forms.map((form) => {
                const live = form.status === 'published';
                const responses = form.submissionCount;
                return (
                  <Card key={form._id} withBorder radius="md" padding="sm" className={classes.row}>
                    <div className={classes.rowInner}>
                      <Group gap="sm" wrap="nowrap" className={classes.rowMain}>
                        <ThemeIcon variant="light" size={40} radius="md">
                          <IconFileText size={20} />
                        </ThemeIcon>
                        <div style={{ minWidth: 0 }}>
                          <Group gap={8} wrap="nowrap">
                            <Link to={`/${workspaceId}/forms/${form._id}/edit`} className={classes.title}>
                              {form.name || form.title}
                            </Link>
                            <StatusPill tone={live ? 'live' : 'idle'} label={live ? 'Live' : 'Draft'} />
                          </Group>
                          <Text size="xs" c="dimmed" truncate>
                            <Tooltip label={`Created ${formatDate(form.createdAt)}`} withArrow openDelay={300}>
                              <span>Edited {relativeTime(form.updatedAt || form.createdAt)}</span>
                            </Tooltip>
                            {narrowRow && responses !== undefined && ` · ${responses.toLocaleString()} responses`}
                          </Text>
                        </div>
                      </Group>

                      {!narrowRow && !isDemo && (
                        <div className={classes.metrics}>
                          <Metric label="Responses" value={responses?.toLocaleString() ?? '—'} />
                          <Metric label="Views" value={(form.viewCount ?? 0).toLocaleString()} />
                          <Metric label="Conversion" value={conversion(form.viewCount, responses)} />
                        </div>
                      )}

                      <Group gap={6} wrap="nowrap" className={classes.rowActions}>
                        {!isDemo && !narrowRow && (
                          <Button
                            component={Link}
                            to={`/${workspaceId}/forms/${form._id}/entries`}
                            variant="default"
                            size="xs"
                            leftSection={<IconInbox size={14} />}
                          >
                            Responses
                          </Button>
                        )}
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
                        {!narrowRow && (
                          <Tooltip label="Preview" withArrow>
                            <ActionIcon variant="subtle" color="gray" size="lg" onClick={() => setPreviewing(form)} aria-label="Preview">
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        {!isDemo && !narrowRow && (
                          <Tooltip label="Share" withArrow>
                            <ActionIcon variant="subtle" color="gray" size="lg" onClick={() => setSharing(form)} aria-label="Share">
                              <IconShare2 size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}

                        {!isDemo && (
                        <Menu shadow="md" position="bottom-end" width={200}>
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray" size="lg" aria-label="More actions">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            {/* Only on the narrow layout, which hides the row buttons
                                these stand in for. */}
                            {narrowRow && (
                              <>
                                <Menu.Item
                                  component={Link}
                                  to={`/${workspaceId}/forms/${form._id}/entries`}
                                  leftSection={<IconInbox size={15} />}
                                >
                                  Responses
                                </Menu.Item>
                                <Menu.Item leftSection={<IconEye size={15} />} onClick={() => setPreviewing(form)}>
                                  Preview
                                </Menu.Item>
                                <Menu.Item leftSection={<IconShare2 size={15} />} onClick={() => setSharing(form)}>
                                  Share
                                </Menu.Item>
                                <Menu.Divider />
                              </>
                            )}
                            <Menu.Item
                              leftSection={live ? <IconEyeOff size={15} /> : <IconWorldUpload size={15} />}
                              onClick={() => toggleStatus(form)}
                            >
                              {live ? 'Unpublish' : 'Publish'}
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
                            <Menu.Item
                              leftSection={<IconClipboardCopy size={15} />}
                              disabled={copyingConfigId === form._id}
                              onClick={() => copyConfig(form)}
                            >
                              Copy config
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item color="red" leftSection={<IconTrash size={15} />} onClick={() => setPendingDelete(form)}>
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                        )}
                      </Group>
                    </div>
                  </Card>
                );
              })}

              {total > PAGE_SIZE && (
                <Group justify="space-between" mt="sm">
                  <Text size="xs" c="dimmed">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                  </Text>
                  <Pagination size="sm" total={Math.ceil(total / PAGE_SIZE)} value={page} onChange={setPage} />
                </Group>
              )}
            </Stack>
          )}
        </div>
      </Stack>

      <NewFormModal
        opened={newFormOpen}
        onClose={() => setNewFormOpen(false)}
        onContinue={(name, scope) => {
          setNewFormOpen(false);
          navigate(
            `/${workspaceId}/forms/create?name=${encodeURIComponent(name)}&scope=${scope}`
          );
        }}
      />

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

      <IntegrationsModal
        opened={integrationsOpen}
        onClose={() => setIntegrationsOpen(false)}
        workspaceId={workspaceId}
        isDemo={isDemo}
      />

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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={classes.metric}>
      <Text size="sm" fw={650} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Text>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </div>
  );
}

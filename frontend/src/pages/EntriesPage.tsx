import { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import {
  Group,
  Text,
  Button,
  ThemeIcon,
  Table,
  Box,
  Menu,
  ActionIcon,
  Pagination,
  Tooltip,
  Skeleton,
  Stack,
  Anchor,
  Image,
  Modal,
  Loader,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconFileText,
  IconVideo,
  IconChevronDown,
  IconShare2,
  IconFilter,
  IconCalendarPlus,
  IconArrowLeft,
  IconFileExport,
  IconLayoutList,
  IconLayoutKanban,
  IconCheck,
  IconEye,
  IconTrash,
  IconFileTypePdf,
  IconMailOpened,
  IconRefresh,
  IconDownload,
  IconExternalLink,
  IconPencil,
  IconX,
} from '@tabler/icons-react';
import {
  getForm,
  listSubmissions,
  updateSubmission,
  deleteSubmission,
  updateForm,
  publicFormUrl,
  getAnalytics,
  type Analytics,
} from '@/lib/api';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import type { Form, Submission } from '@/types';
import { paletteByType, staticTypes, fileTypes } from '@/lib/fieldPalette';
import { valueFields } from '@/lib/fieldTree';
import { EntriesKanban } from '@/components/builder/EntriesKanban';
import { AnalyticsBar } from '@/components/builder/AnalyticsBar';
import { downloadSubmissionPdf } from '@/lib/submissionPdf';
import classes from './EntriesPage.module.css';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isImageUrl(url: string) {
  return /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i.test(url);
}

type StatusFilter = 'all' | 'unread' | 'read';
type DayFilter = 'all' | 'today' | '7' | '30';

const STATUS_LABEL: Record<StatusFilter, string> = {
  all: 'All Entries',
  unread: 'Unread',
  read: 'Read',
};

const DAY_LABEL: Record<DayFilter, string> = {
  all: 'All Days',
  today: 'Today',
  '7': 'Last 7 Days',
  '30': 'Last 30 Days',
};

function dayFilterToRange(day: DayFilter): { from?: string } {
  if (day === 'all') return {};
  const now = new Date();
  const days = day === 'today' ? 0 : Number(day) - 1;
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString() };
}

const PAGE_SIZE = 10;

export function EntriesPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const workspaceId = useWorkspaceId();
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [day, setDay] = useState<DayFilter>('all');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [viewing, setViewing] = useState<Submission | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Submission | null>(null);
  const [attachment, setAttachment] = useState<{ url: string; name: string; image: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  const loadSubmissions = useCallback(() => {
    if (!id) return;
    setLoading(true);
    listSubmissions(id, workspaceId, {
      page: view === 'kanban' ? 1 : page,
      limit: view === 'kanban' ? 200 : PAGE_SIZE,
      status: view === 'kanban' ? 'all' : status,
      ...dayFilterToRange(day),
    })
      .then((res) => {
        setSubmissions(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [id, workspaceId, page, status, day, view]);

  const loadAnalytics = useCallback(() => {
    if (!id) return;
    getAnalytics(id, workspaceId)
      .then(setAnalytics)
      .catch(() => notifications.show({ message: 'Could not load analytics', color: 'red' }));
  }, [id, workspaceId]);

  useEffect(() => {
    if (!id) return;
    getForm(id, workspaceId)
      .then(setForm)
      .catch(() => notifications.show({ message: 'Could not load this form', color: 'red' }));
    loadAnalytics();
  }, [id, workspaceId, loadAnalytics]);

  useEffect(() => {
    loadSubmissions();
  }, [location.key, loadSubmissions]);

  // Filters reset paging so a narrower result set never lands on a page past its end.
  useEffect(() => {
    setPage(1);
  }, [status, day]);

  async function moveSubmission(submissionId: string, patch: Partial<Pick<Submission, 'read'>>) {
    if (!id) return;
    const updated = await updateSubmission(id, submissionId, patch, workspaceId);
    setSubmissions((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
  }

  async function markRead(submission: Submission) {
    if (!id || submission.read) return;
    const updated = await updateSubmission(id, submission._id, { read: true }, workspaceId);
    setSubmissions((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    setViewing((current) => (current?._id === updated._id ? updated : current));
  }

  async function confirmDeleteSubmission() {
    if (!id || !pendingDelete) return;
    setDeleting(true);
    try {
      await deleteSubmission(id, pendingDelete._id, workspaceId);
      setSubmissions((prev) => prev.filter((s) => s._id !== pendingDelete._id));
      setTotal((prev) => prev - 1);
      loadAnalytics();
      notifications.show({ message: 'Response deleted', color: 'emerald' });
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  function startEditingName() {
    if (!form) return;
    setNameDraft(form.name || form.title);
    setEditingName(true);
  }

  async function saveName() {
    if (!id || !form) return;
    const name = nameDraft.trim();
    if (!name || name === (form.name || form.title)) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const updated = await updateForm(id, { name }, workspaceId);
      setForm(updated);
      setEditingName(false);
    } catch {
      notifications.show({ message: 'Could not rename form', color: 'red' });
    } finally {
      setSavingName(false);
    }
  }

  function copyShareLink() {
    if (!id) return;
    navigator.clipboard.writeText(publicFormUrl(id));
    notifications.show({ message: 'Link copied', color: 'emerald' });
  }

  function exportCsv() {
    if (!form) return;
    const header = [...columns.map((f) => f.label), 'Added Time'];
    const rows = submissions.map((s) => [
      ...columns.map((f) => JSON.stringify(s.data[f.id] ?? '')),
      JSON.stringify(formatDateTime(s.createdAt)),
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.title || 'entries'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // layout-only elements never collect a value, so they get no column
  const columns = form
    ? valueFields(form.fields).filter((field) => !staticTypes.includes(field.type))
    : [];

  return (
    <Box>
      <Group justify="space-between" px="md" py="sm" className={classes.topbar} wrap="nowrap">
        {form ? (
          <>
            <Group gap="xs" wrap="nowrap">
              <ActionIcon component={Link} to={`/${workspaceId}/forms`} variant="subtle" color="gray" size="lg" aria-label="Back to all forms">
                <IconArrowLeft size={19} />
              </ActionIcon>
             
              {editingName ? (
                <Group gap={4} wrap="nowrap">
                  <TextInput
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveName();
                      if (e.key === 'Escape') setEditingName(false);
                    }}
                    size="sm"
                    autoFocus
                    disabled={savingName}
                  />
                  <ActionIcon variant="subtle" color="emerald" size="lg" aria-label="Save name" onClick={saveName} loading={savingName}>
                    <IconCheck size={16} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Cancel" onClick={() => setEditingName(false)} disabled={savingName}>
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
              ) : (
                <Group gap={4} wrap="nowrap">
                  <Text fw={600} component={Link} to={`/${workspaceId}/forms/${form._id}/edit`} className={classes.formLink}>
                    {form.name || form.title}
                  </Text>
                  <Tooltip label="Rename form" withArrow>
                    <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Rename form" onClick={startEditingName}>
                      <IconPencil size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              )}
            </Group>
            <Group gap="xs">
              <Button variant="default" radius="md" color="emerald" onClick={copyShareLink}>
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
          </>
        ) : (
          <>
            <Group gap="xs" wrap="nowrap">
              <Skeleton height={28} width={28} radius="sm" />
              <Skeleton height={20} width={160} radius="sm" />
            </Group>
            <Group gap="xs">
              <Skeleton height={32} width={80} radius="md" />
              <Skeleton height={32} width={110} radius="md" />
            </Group>
          </>
        )}
      </Group>

      <AnalyticsBar analytics={analytics} />

      <Group justify="space-between" px="md" py="xs" className={classes.filterbar} wrap="nowrap">
        <Group gap="lg">
          <Menu shadow="md" width={160}>
            <Menu.Target>
              <Group gap={4} className={classes.filterItem}>
                <Text fw={600} size="sm">
                  {STATUS_LABEL[status]}
                </Text>
                <IconChevronDown size={14} />
              </Group>
            </Menu.Target>
            <Menu.Dropdown>
              {(Object.keys(STATUS_LABEL) as StatusFilter[]).map((key) => (
                <Menu.Item key={key} onClick={() => setStatus(key)}>
                  {STATUS_LABEL[key]}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>

          <Text c="dimmed">|</Text>

          <Menu shadow="md" width={160}>
            <Menu.Target>
              <Group gap={4} className={classes.filterItem}>
                <Text fw={600} size="sm">
                  {DAY_LABEL[day]}
                </Text>
                <IconChevronDown size={14} />
              </Group>
            </Menu.Target>
            <Menu.Dropdown>
              {(Object.keys(DAY_LABEL) as DayFilter[]).map((key) => (
                <Menu.Item key={key} onClick={() => setDay(key)}>
                  {DAY_LABEL[key]}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Group gap="xs">
          <Menu shadow="md" width={160} position="bottom-end">
            <Menu.Target>
              <Tooltip label="View" withArrow>
                <ActionIcon variant="subtle" color="gray">
                  {view === 'list' ? <IconLayoutList size={17} /> : <IconLayoutKanban size={17} />}
                </ActionIcon>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconLayoutList size={15} />}
                rightSection={view === 'list' ? <IconCheck size={14} color="var(--mantine-color-emerald-6)" /> : undefined}
                onClick={() => setView('list')}
              >
                List View
              </Menu.Item>
              <Menu.Item
                leftSection={<IconLayoutKanban size={15} />}
                rightSection={view === 'kanban' ? <IconCheck size={14} color="var(--mantine-color-emerald-6)" /> : undefined}
                onClick={() => setView('kanban')}
              >
                Kanban View
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Tooltip label="Copy share link" withArrow>
            <ActionIcon variant="subtle" color="gray" onClick={copyShareLink}>
              <IconShare2 size={17} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Refresh responses" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => {
                loadSubmissions();
                loadAnalytics();
              }}
              loading={loading}
              aria-label="Refresh responses"
            >
              <IconRefresh size={17} />
            </ActionIcon>
          </Tooltip>
          <Menu shadow="md" width={160}>
            <Menu.Target>
              <Tooltip label="Filter" withArrow>
                <ActionIcon variant="subtle" color="gray">
                  <IconFilter size={17} />
                </ActionIcon>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              {(Object.keys(STATUS_LABEL) as StatusFilter[]).map((key) => (
                <Menu.Item key={key} onClick={() => setStatus(key)}>
                  {STATUS_LABEL[key]}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
          <Tooltip label="Export CSV" withArrow>
            <ActionIcon variant="subtle" color="gray" onClick={exportCsv}>
              <IconFileExport size={17} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {view === 'kanban' ? (
        <EntriesKanban submissions={submissions} columns={columns} onMove={moveSubmission} />
      ) : (
        <>
          <Table.ScrollContainer minWidth={0} className={classes.tableWrap}>
            <Table
              withTableBorder
              highlightOnHover
              className={`${classes.table} ${loading && submissions.length > 0 ? classes.tableLoading : ''}`}
              aria-busy={loading}
            >
              <Table.Thead className={classes.thead}>
                <Table.Tr>
                  {columns.map((field) => {
                    const meta = paletteByType[field.type];
                    return (
                      <Table.Th key={field.id} className={classes.th}>
                        <Group gap={6} wrap="nowrap">
                          <meta.icon size={15} stroke={1.6} color="var(--mantine-color-gray-6)" />
                          <Text size="sm" fw={600}>
                            {field.label}
                          </Text>
                        </Group>
                      </Table.Th>
                    );
                  })}
                  <Table.Th className={classes.th}>
                    <Group gap={6} wrap="nowrap">
                      <IconCalendarPlus size={15} stroke={1.6} color="var(--mantine-color-gray-6)" />
                      <Text size="sm" fw={600}>
                        Added Time
                      </Text>
                    </Group>
                  </Table.Th>
                  <Table.Th className={`${classes.th} ${classes.actionsCol}`}>
                    <Text size="sm" fw={600}>
                      Actions
                    </Text>
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {loading && submissions.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={columns.length + 2} className={classes.loadingCell}>
                      <Loader size="sm" color="emerald" />
                    </Table.Td>
                  </Table.Tr>
                ) : submissions.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={columns.length + 2}>
                      <Stack align="center" gap={4} py="xl">
                        <ThemeIcon variant="light" color="gray" size={44} radius="xl">
                          <IconMailOpened size={22} />
                        </ThemeIcon>
                        <Text fw={600} size="sm">
                          No responses yet
                        </Text>
                        <Text size="xs" c="dimmed" ta="center" maw={320}>
                          Share your form's link to start collecting responses.
                        </Text>
                        <Button
                          variant="light"
                          color="emerald"
                          size="xs"
                          mt="xs"
                          leftSection={<IconShare2 size={14} />}
                          onClick={copyShareLink}
                        >
                          Copy share link
                        </Button>
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  submissions.map((submission) => (
                    <Table.Tr
                      key={submission._id}
                      onClick={() => markRead(submission)}
                      style={{ fontWeight: submission.read ? 400 : 700 }}
                    >
                      {columns.map((field) => {
                        const raw = submission.data[field.id] ?? '';
                        // Older submissions (or builder-preview edits) may only hold a bare
                        // filename from before uploads were wired to Cloudinary — link only
                        // what's actually a URL.
                        const isFileLink = fileTypes.includes(field.type) && /^https?:\/\//.test(raw);
                        const isImage = isFileLink && (field.type === 'imageUpload' || isImageUrl(raw));
                        const fileName = raw.split('/').pop() || 'Attachment';
                        return (
                          <Table.Td key={field.id}>
                            {isImage ? (
                              <Anchor href={raw} target="_blank" rel="noopener noreferrer">
                                  <Image
                                    src={raw}
                                    alt={fileName}
                                    h={40}
                                    w={40}
                                    fit="cover"
                                    radius="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setAttachment({ url: raw, name: fileName, image: true });
                                    }}
                                  />
                              </Anchor>
                            ) : isFileLink ? (
                              <Anchor
                                href={raw}
                                target="_blank"
                                rel="noopener noreferrer"
                                underline="never"
                                c="inherit"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setAttachment({ url: raw, name: fileName, image: false });
                                }}
                              >
                                <Group gap={6} wrap="nowrap">
                                  <ThemeIcon variant="light" color="gray" size={28} radius="sm">
                                    {field.type === 'mediaUpload' ? <IconVideo size={15} /> : <IconFileText size={15} />}
                                  </ThemeIcon>
                                  <Text size="sm" td="underline" truncate maw={160}>
                                    {fileName}
                                  </Text>
                                </Group>
                              </Anchor>
                            ) : (
                              <Text size="sm" className={classes.cellText} title={raw}>
                                {raw}
                              </Text>
                            )}
                          </Table.Td>
                        );
                      })}
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {formatDateTime(submission.createdAt)}
                        </Text>
                      </Table.Td>
                      <Table.Td className={classes.actionsCol} onClick={(e) => e.stopPropagation()}>
                        <Group gap={4} wrap="nowrap">
                          <Tooltip label="View response" withArrow>
                            <ActionIcon variant="subtle" color="gray" onClick={() => setViewing(submission)}>
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Download PDF" withArrow>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              onClick={() => downloadSubmissionPdf(form?.title ?? '', columns, submission)}
                            >
                              <IconFileTypePdf size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete response" withArrow>
                            <ActionIcon variant="subtle" color="red" onClick={() => setPendingDelete(submission)}>
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          <Group justify="flex-end" px="md" py="md">
            <Pagination
              total={Math.max(1, Math.ceil(total / PAGE_SIZE))}
              value={page}
              onChange={setPage}
              color="emerald"
              disabled={total <= PAGE_SIZE}
            />
          </Group>
        </>
      )}

      <Modal
        opened={!!viewing}
        onClose={() => setViewing(null)}
        title="Response"
        size="lg"
        centered
        radius="lg"
        classNames={{ content: classes.responseModal, body: classes.responseBody }}
      >
        {viewing && (
          <Stack gap="md">
            <Group justify="space-between" className={classes.responseMeta}>
              <Text size="sm" c="dimmed">
                {viewing.read ? 'Read response' : 'Unread response'}
              </Text>
              <Group gap="xs">
                <Tooltip label={viewing.read ? 'Already read' : 'Mark as read'} withArrow>
                  <ActionIcon
                    variant="light"
                    color="emerald"
                    disabled={viewing.read}
                    aria-label={viewing.read ? 'Response already read' : 'Mark response as read'}
                    onClick={() => markRead(viewing)}
                  >
                    <IconMailOpened size={17} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete response" withArrow>
                  <ActionIcon
                    variant="light"
                    color="red"
                    aria-label="Delete response"
                    onClick={() => {
                      setPendingDelete(viewing);
                      setViewing(null);
                    }}
                  >
                    <IconTrash size={17} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>

            <div className={classes.responseGrid}>
              {columns.map((field) => {
                const raw = viewing.data[field.id] ?? '';
                const isFileLink = fileTypes.includes(field.type) && /^https?:\/\//.test(raw);
                const isImage = isFileLink && (field.type === 'imageUpload' || isImageUrl(raw));
                const fileName = raw.split('/').pop() || 'Attachment';
                return (
                  <div key={field.id} className={`${classes.responseField} ${isImage ? classes.mediaField : ''}`}>
                    <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
                      {field.label}
                    </Text>
                    {isImage ? (
                      <Anchor
                        href={raw}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          setAttachment({ url: raw, name: fileName, image: true });
                        }}
                      >
                        <Image src={raw} alt={fileName} mah={220} w="auto" fit="contain" radius="sm" />
                      </Anchor>
                    ) : isFileLink ? (
                      <Anchor
                        href={raw}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="never"
                        c="inherit"
                        onClick={(e) => {
                          e.preventDefault();
                          setAttachment({ url: raw, name: fileName, image: false });
                        }}
                      >
                        <Group gap={6} wrap="nowrap">
                          <ThemeIcon variant="light" color="gray" size={28} radius="sm">
                            {field.type === 'mediaUpload' ? <IconVideo size={15} /> : <IconFileText size={15} />}
                          </ThemeIcon>
                          <Text size="sm" td="underline">
                            {fileName}
                          </Text>
                        </Group>
                      </Anchor>
                    ) : (
                      <Text size="sm">{raw || '—'}</Text>
                    )}
                  </div>
                );
              })}
              <div className={classes.responseField}>
                <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
                  Added Time
                </Text>
                <Text size="sm">{formatDateTime(viewing.createdAt)}</Text>
              </div>
            </div>

            <Group justify="flex-end" className={classes.responseFooter}>
              <Button
                variant="default"
                leftSection={<IconFileTypePdf size={16} />}
                onClick={() => downloadSubmissionPdf(form?.title ?? '', columns, viewing)}
              >
                Download PDF
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <Modal
        opened={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete response"
        centered
        radius="lg"
      >
        <Text size="sm">This response will be permanently removed. This can't be undone.</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button color="red" loading={deleting} onClick={confirmDeleteSubmission}>
            Delete
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={!!attachment}
        onClose={() => setAttachment(null)}
        title={attachment?.name ?? 'Attachment'}
        size="xl"
        centered
        radius="lg"
        classNames={{ content: classes.attachmentModal, body: classes.attachmentBody }}
      >
        {attachment && (
          <Stack gap="md">
            <Box className={classes.attachmentPreview}>
              {attachment.image ? (
                <Image
                  src={attachment.url}
                  alt={attachment.name}
                  fit="contain"
                  mah="65vh"
                  maw="100%"
                />
              ) : (
                <iframe
                  src={attachment.url}
                  title={attachment.name}
                  className={classes.attachmentFrame}
                />
              )}
            </Box>
            <Group justify="flex-end" gap="sm">
              <Button
                component="a"
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                variant="default"
                leftSection={<IconExternalLink size={16} />}
              >
                Open in new tab
              </Button>
              <Button
                component="a"
                href={attachment.url}
                download={attachment.name}
                color="emerald"
                leftSection={<IconDownload size={16} />}
              >
                Download
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}

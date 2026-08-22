import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconFileText,
  IconChevronDown,
  IconShare2,
  IconFilter,
  IconCalendarPlus,
  IconArrowLeft,
  IconFileExport,
  IconLayoutList,
  IconLayoutKanban,
  IconCheck,
} from '@tabler/icons-react';
import { getForm, listSubmissions, updateSubmission } from '@/lib/api';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import type { Form, Submission } from '@/types';
import { paletteByType, staticTypes } from '@/lib/fieldPalette';
import { valueFields } from '@/lib/fieldTree';
import { EntriesKanban } from '@/components/builder/EntriesKanban';
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
  const workspaceId = useWorkspaceId();
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [day, setDay] = useState<DayFilter>('all');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (!id) return;
    getForm(id, workspaceId).then(setForm);
  }, [id, workspaceId]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

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
  }

  function copyShareLink() {
    if (!id) return;
    navigator.clipboard.writeText(`${window.location.origin}/f/${id}`);
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

  if (!form)
    return (
      <Box>
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

        <Group justify="space-between" px="md" py="xs" className={classes.filterbar} wrap="nowrap">
          <Group gap="lg">
            <Skeleton height={18} width={90} />
            <Skeleton height={18} width={90} />
          </Group>
          <Group gap="xs">
            <Skeleton height={28} width={28} radius="xl" circle />
            <Skeleton height={28} width={28} radius="xl" circle />
            <Skeleton height={28} width={28} radius="xl" circle />
            <Skeleton height={28} width={28} radius="xl" circle />
          </Group>
        </Group>

        <Box className={classes.tableWrap} px="md" py="md">
          <Stack gap="sm">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={40} radius="sm" />
            ))}
          </Stack>
        </Box>
      </Box>
    );

  // layout-only elements never collect a value, so they get no column
  const columns = valueFields(form.fields).filter(
    (field) => !staticTypes.includes(field.type)
  );

  return (
    <Box>
      <Group justify="space-between" px="md" py="sm" className={classes.topbar} wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <ActionIcon component={Link} to={`/${workspaceId}/forms`} variant="subtle" color="gray" size="lg" aria-label="Back to all forms">
            <IconArrowLeft size={19} />
          </ActionIcon>
          <ThemeIcon variant="light" color="gray" radius="sm">
            <IconFileText size={18} />
          </ThemeIcon>
          <Text fw={600} component={Link} to={`/${workspaceId}/forms/${form._id}/edit`} className={classes.formLink}>
            {form.title}
          </Text>
        </Group>
        <Group gap="xs">
          <Button variant="default" radius="md" color="emerald" onClick={copyShareLink}>
            Share
          </Button>
          <Button color="emerald" radius="md">
            New Report
          </Button>
        </Group>
      </Group>

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
          <Box className={classes.tableWrap}>
            <Table withTableBorder highlightOnHover className={classes.table}>
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
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {submissions.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={columns.length + 1}>
                      <Text ta="center" py="xl" c="emerald">
                        {loading ? 'Loading…' : 'No entries'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  submissions.map((submission) => (
                    <Table.Tr
                      key={submission._id}
                      onClick={() => markRead(submission)}
                      style={{ fontWeight: submission.read ? 400 : 700 }}
                    >
                      {columns.map((field) => (
                        <Table.Td key={field.id}>
                          <Text size="sm">{submission.data[field.id] ?? ''}</Text>
                        </Table.Td>
                      ))}
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {formatDateTime(submission.createdAt)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Box>

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
    </Box>
  );
}

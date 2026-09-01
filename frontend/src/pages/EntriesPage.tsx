import { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  getForm,
  listSubmissions,
  updateSubmission,
  deleteSubmission,
  bulkDeleteSubmissions,
  updateForm,
  publicFormUrl,
  getAnalytics,
  type Analytics,
} from '@/lib/api';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import type { Form, Submission } from '@/types';
import { staticTypes } from '@/lib/fieldPalette';
import { valueFields } from '@/lib/fieldTree';
import { EntriesKanban } from '@/components/builder/EntriesKanban';
import { AnalyticsBar } from '@/components/builder/AnalyticsBar';
import { paymentCellText } from '@/lib/payment';
import { EntriesTopbar } from '@/components/builder/entries/EntriesTopbar';
import { EntriesFilterBar } from '@/components/builder/entries/EntriesFilterBar';
import { EntriesTableSkeleton } from '@/components/builder/entries/EntriesTableSkeleton';
import { EntriesTable } from '@/components/builder/entries/EntriesTable';
import { ResponseModal } from '@/components/builder/entries/ResponseModal';
import { DeleteResponseModal } from '@/components/builder/entries/DeleteResponseModal';
import { BulkActionBar } from '@/components/builder/entries/BulkActionBar';
import { AttachmentModal, type AttachmentState } from '@/components/builder/entries/AttachmentModal';
import { dayFilterToRange, formatDateTime, PAGE_SIZE, type DayFilter, type StatusFilter } from '@/components/builder/entries/entriesTypes';
import classes from './EntriesPage.module.css';

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
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [viewing, setViewing] = useState<Submission | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Submission | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [attachment, setAttachment] = useState<AttachmentState>(null);
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
    // A fresh page of submissions invalidates any selection made on the
    // previous one — ids that no longer appear on screen shouldn't stay
    // checked in the background.
    setSelected(new Set());
  }, [location.key, loadSubmissions]);

  /**
   * A filter change, with paging reset in the same update.
   *
   * Resetting the page from its own effect instead meant two renders with two
   * different `page` values for one interaction — and since the loader is keyed
   * on `page`, that fetched the list twice.
   */
  const setFilter = (patch: Partial<{ status: StatusFilter; day: DayFilter }>) => {
    if (patch.status) setStatus(patch.status);
    if (patch.day) setDay(patch.day);
    setPage(1);
  };

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

  function toggleSelect(submissionId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(submissionId)) next.delete(submissionId);
      else next.add(submissionId);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelected(checked ? new Set(submissions.map((s) => s._id)) : new Set());
  }

  async function confirmBulkDelete() {
    if (!id || selected.size === 0) return;
    setDeleting(true);
    try {
      const ids = [...selected];
      await bulkDeleteSubmissions(id, ids, workspaceId);
      setSubmissions((prev) => prev.filter((s) => !selected.has(s._id)));
      setTotal((prev) => prev - ids.length);
      setSelected(new Set());
      loadAnalytics();
      notifications.show({ message: `${ids.length} responses deleted`, color: 'emerald' });
      setPendingBulkDelete(false);
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
      ...columns.map((f) =>
        JSON.stringify(
          // A payment column has no answer in `data` — its value is on the
          // submission, written by the webhook.
          f.type === 'payment' ? paymentCellText(s.payment) : (s.data[f.id] ?? '')
        )
      ),
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
    <Box className={classes.page}>
      <EntriesTopbar
        form={form}
        workspaceId={workspaceId}
        editingName={editingName}
        nameDraft={nameDraft}
        savingName={savingName}
        onStartEditingName={startEditingName}
        onNameDraftChange={setNameDraft}
        onSaveName={saveName}
        onCancelEditingName={() => setEditingName(false)}
        onCopyShareLink={copyShareLink}
      />

      <AnalyticsBar analytics={analytics} />

      <EntriesFilterBar
        status={status}
        day={day}
        view={view}
        loading={loading}
        onFilter={setFilter}
        onSetView={(v) => {
          setView(v);
          // Kanban has no checkboxes, so a selection carried over from list
          // view would leave the floating bar showing with no way to change it.
          setSelected(new Set());
        }}
        onCopyShareLink={copyShareLink}
        onRefresh={() => {
          loadSubmissions();
          loadAnalytics();
        }}
        onExportCsv={exportCsv}
      />

      {/* Before `form` loads there are no field columns yet, so the real
          table (header included) can't draw its real shape — showing it with
          an empty column set and then reflowing once `form` arrives read as
          two different tables. And `form` alone isn't enough to switch off
          the skeleton: submissions load separately, so dropping to the real
          table the moment `form` lands but before that fetch resolves showed
          the "no responses yet" empty state for a beat, on a form that likely
          has responses. Keep the skeleton up until both are ready. */}
      {!form || (loading && submissions.length === 0) ? (
        <EntriesTableSkeleton />
      ) : view === 'kanban' ? (
        <EntriesKanban submissions={submissions} columns={columns} onMove={moveSubmission} />
      ) : (
        <EntriesTable
          form={form}
          columns={columns}
          submissions={submissions}
          total={total}
          page={page}
          loading={loading}
          selected={selected}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onPageChange={setPage}
          onMarkRead={markRead}
          onView={setViewing}
          onDelete={setPendingDelete}
          onCopyShareLink={copyShareLink}
          onOpenAttachment={setAttachment}
        />
      )}

      <BulkActionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        onDelete={() => setPendingBulkDelete(true)}
      />

      <ResponseModal
        form={form}
        columns={columns}
        viewing={viewing}
        onClose={() => setViewing(null)}
        onMarkRead={markRead}
        onDelete={(submission) => {
          setPendingDelete(submission);
          setViewing(null);
        }}
        onOpenAttachment={setAttachment}
      />

      {/* One modal for both flows: a single row's delete icon sets
          `pendingDelete`, the bulk bar sets `pendingBulkDelete` — never both
          at once, so `count` and `onConfirm` just follow whichever is set. */}
      <DeleteResponseModal
        opened={!!pendingDelete || pendingBulkDelete}
        deleting={deleting}
        count={pendingBulkDelete ? selected.size : 1}
        onClose={() => {
          setPendingDelete(null);
          setPendingBulkDelete(false);
        }}
        onConfirm={pendingBulkDelete ? confirmBulkDelete : confirmDeleteSubmission}
      />

      <AttachmentModal attachment={attachment} onClose={() => setAttachment(null)} />
    </Box>
  );
}

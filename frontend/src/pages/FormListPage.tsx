import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Badge, Box, Button, Group, Text, Tooltip } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { InfoIcon, PlugIcon, PlusIcon } from 'lucide-react';
import { DocsButton } from '@/components/ui/DocsButton';
import { IS_EMBEDDED } from '@/lib/bootParams';
import { HostNotificationsBell } from '@/components/HostNotificationsBell';
import { deleteForm, updateForm, duplicateForm as duplicateFormApi, exportFormConfig } from '@/lib/api';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { useHostPhone } from '@/hooks/useHostPhone';
import { useBuilderTooSmall } from '@/hooks/useBuilderTooSmall';
import { isDemoWorkspace } from '@/lib/demoWorkspace';
import { notify } from '@/lib/notify';
import type { Form, FormTheme } from '@/types';
import { NewFormModal } from '@/components/NewFormModal';
import { ShareModal } from '@/components/share/ShareModal';
import { PreviewModal } from '@/components/builder/PreviewModal';
import { IntegrationsModal } from '@/components/apps/IntegrationsModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { FormListToolbar } from './formList/FormListToolbar';
import { FormList } from './formList/FormList';
import { FormListEmpty } from './formList/FormListEmpty';
import { DeleteFormModal } from './formList/DeleteFormModal';
import { useFormList } from './formList/useFormList';
import type { FormRowActions } from './formList/FormRow';
import classes from './FormListPage.module.css';

export function FormListPage() {
  const workspaceId = useWorkspaceId();
  const isDemo = isDemoWorkspace(workspaceId);
  const navigate = useNavigate();
  const list = useFormList(workspaceId, isDemo);
  const [newFormOpen, setNewFormOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Form | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState<Form | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [copyingConfigId, setCopyingConfigId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<Form | null>(null);
  const builderTooSmall = useBuilderTooSmall();
  const { ref: pageRef, width: pageWidth } = useElementSize();
  const compact = pageWidth > 0 && pageWidth <= 640;
  const hostPhone = useHostPhone();

  function startCreate() {
    if (builderTooSmall) {
      notify.info(
        'The form editor needs a tablet or computer. You can still view, share and manage your forms here.',
        undefined,
        5000,
      );
      return;
    }
    setNewFormOpen(true);
  }

  async function toggleStatus(form: Form) {
    const status = form.status === 'published' ? 'draft' : 'published';
    list.replaceForm(await updateForm(form._id, { status }, workspaceId));
    if (status === 'published') notify.success('Form published');
    else notify.info('Form moved back to draft');
  }

  async function duplicateForm(form: Form) {
    setDuplicatingId(form._id);
    try {
      await duplicateFormApi(form._id, workspaceId);
      notify.success('Form duplicated');
      list.load();
    } finally {
      setDuplicatingId(null);
    }
  }

  async function copyConfig(form: Form) {
    setCopyingConfigId(form._id);
    try {
      const config = await exportFormConfig(form._id, workspaceId);
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      notify.success('Config copied — paste it into another workspace');
    } catch {
      notify.error('Could not copy the config');
    } finally {
      setCopyingConfigId(null);
    }
  }

  async function applyTheme(form: Form, patch: Partial<FormTheme>) {
    const theme = { ...form.theme, ...patch, scope: form.theme?.scope ?? 'page' } as FormTheme;
    const updated = await updateForm(form._id, { theme }, workspaceId);
    list.replaceForm(updated);
    setPreviewing(updated);
    notify.success('Theme applied');
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    await deleteForm(pendingDelete._id, workspaceId);
    setDeleting(false);
    setPendingDelete(null);
    notify.success('Form deleted');
    list.load();
  }

  const rowActions: FormRowActions = {
    onPreview: setPreviewing,
    onShare: setSharing,
    onToggleStatus: toggleStatus,
    onDuplicate: duplicateForm,
    onCopyConfig: copyConfig,
    onDelete: setPendingDelete,
  };

  const isEmpty = list.forms.length === 0 && !list.loading;

  return (
    <Box className={classes.page} ref={pageRef}>
      <PageHeader
        title={
          <Group gap="sm" wrap="nowrap" component="span">
            Lead capture
            {isDemo && (
              <Badge color="gray" variant="light">
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
                <span>
                  <Button leftSection={<PlusIcon size={16} />} disabled>
                    New form
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Button leftSection={<PlusIcon size={16} />} onClick={startCreate}>
                New form
              </Button>
            )}
            <Button variant="default" leftSection={<PlugIcon size={16} />} onClick={() => setIntegrationsOpen(true)}>
              Integrations
            </Button>
            {!hostPhone && <DocsButton path="/lead-capture" />}
            {IS_EMBEDDED && <HostNotificationsBell />}
          </>
        }
      />

      {isDemo && (
        <Alert color="blue" variant="light" mb="xl" icon={<InfoIcon size={18} />}>
          <Text fw={600} size="sm">
            You are looking at sample forms
          </Text>
          <Text size="sm" mt={4}>
            This workspace is a read-only tour of the builder while it is in testing. Open any form to explore the
            editor, themes and preview — nothing you change here is saved, and new forms cannot be created. Real forms
            live in your own workspace.
          </Text>
        </Alert>
      )}

      <FormListToolbar
        search={list.search}
        status={list.status}
        sort={list.sort}
        loading={list.loading}
        narrow={compact}
        onSearch={(q) => list.setFilter({ q })}
        onStatus={(status) => list.setFilter({ status })}
        onSort={(sort) => list.setFilter({ sort })}
        onRefresh={() => list.load()}
      />

      {isEmpty ? (
        <FormListEmpty
          filtered={list.isFiltered}
          canCreate={!isDemo}
          onClearFilters={() => list.setFilter({ q: '', status: 'all' })}
          onCreate={startCreate}
        />
      ) : (
        <FormList
          forms={list.forms}
          loading={list.loading}
          total={list.total}
          page={list.page}
          onPage={list.setPage}
          workspaceId={workspaceId}
          isDemo={isDemo}
          compact={compact}
          duplicatingId={duplicatingId}
          copyingConfigId={copyingConfigId}
          actions={rowActions}
        />
      )}

      <NewFormModal
        opened={newFormOpen}
        onClose={() => setNewFormOpen(false)}
        onContinue={(name, scope) => {
          setNewFormOpen(false);
          navigate(`/${workspaceId}/forms/create?name=${encodeURIComponent(name)}&scope=${scope}`);
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
          onApplyTheme={isDemo ? undefined : (patch) => applyTheme(previewing, patch)}
        />
      )}

      {sharing && (
        <ShareModal
          opened
          onClose={() => setSharing(null)}
          form={sharing}
          onStatusChange={(status) =>
            list.setForms((prev) => prev.map((f) => (f._id === sharing._id ? { ...f, status } : f)))
          }
        />
      )}

      <IntegrationsModal
        opened={integrationsOpen}
        onClose={() => setIntegrationsOpen(false)}
        workspaceId={workspaceId}
        isDemo={isDemo}
      />

      <DeleteFormModal
        form={pendingDelete}
        deleting={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}

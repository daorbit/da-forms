import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { AppShell, Stack, Skeleton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { getPaymentSettings } from '@/lib/api';
import { onReturnFromConnections, openConnections } from '@/lib/hostConnections';
import { findPaymentField } from '@/lib/payment';
import { isDemoWorkspace } from '@/lib/demoWorkspace';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { useEmbedded } from '@/hooks/useEmbedded';
import { useHostEditorOpen } from '@/hooks/useHostEditorOpen';
import { useBuilderTooSmall } from '@/hooks/useBuilderTooSmall';
import { MobileBuilder } from '@/components/builder/mobile/MobileBuilder';
import type { PaymentSettings } from '@/types';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { findField } from '@/lib/fieldTree';
import { QuickInsertModal } from '@/components/builder/canvas/QuickInsertModal';
import { ShortcutsModal } from '@/components/builder/ShortcutsModal';
import { DragChip } from './formBuilder/DragChip';
import { useBuilderShortcuts } from './formBuilder/useBuilderShortcuts';
import type { DragData } from '@/components/builder/dnd';
import { FieldPalette } from '@/components/builder/FieldPalette';
import { FormCanvas } from '@/components/builder/FormCanvas';
import { IconRail, type RailPanel } from '@/components/builder/IconRail';
import { useFormBuilderState, type BuilderLocationState } from './formBuilder/useFormBuilderState';
import { useFieldOps } from './formBuilder/useFieldOps';
import { useFormPersistence } from './formBuilder/useFormPersistence';
import { useAiRevision } from './formBuilder/useAiRevision';
import { useTemplateSwitch } from './formBuilder/useTemplateSwitch';
import { TemplateSwitcher } from '@/components/builder/templateSwitch/TemplateSwitcher';
import { BuilderHeader } from './formBuilder/BuilderHeader';
import { BuilderDrawers } from './formBuilder/BuilderDrawers';
import classes from './FormBuilderPage.module.css';
import { notify } from '@/lib/notify';

export function FormBuilderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: routeFormId } = useParams<{ id: string }>();
  const workspaceId = useWorkspaceId();
  const isDemo = isDemoWorkspace(workspaceId);
  const embedded = useEmbedded();
  const tooSmall = useBuilderTooSmall();
  useHostEditorOpen();
  const locationState = (location.state as BuilderLocationState | null) ?? null;

  const state = useFormBuilderState({ routeFormId, workspaceId, isDemo, locationState });

  // Local-only UI state that never needs snapshotting.
  const [formSettingsOpen, setFormSettingsOpen] = useState(false);
  const [railPanel, setRailPanel] = useState<RailPanel | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [publishedOpen, setPublishedOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure(false);
  const [dragging, setDragging] = useState<DragData | null>(null);
  const [pendingLeave, setPendingLeave] = useState(false);
  const [insertOpen, setInsertOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // A few pixels of travel before a drag starts, so clicking a field to open
  // its properties is not read as the beginning of one.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const {
    addField,
    insertFieldAt,
    insertFieldAfter,
    moveFieldBy,
    updateField,
    removeField,
    duplicateField,
    handleDragEnd,
  } = useFieldOps({
    fields: state.fields,
    setFields: state.setFields,
    selectedId: state.selectedId,
    setSelectedId: state.setSelectedId,
    editingId: state.editingId,
    setEditingId: state.setEditingId,
    setDragging,
  });

  const { handleSave, handleTogglePublish } = useFormPersistence({
    state,
    workspaceId,
    isDemo,
    paymentSettings,
    setSaving,
    setPublishing,
    setShareOpen,
    onPublished: () => setPublishedOpen(true),
  });

  const { aiSnapshot, applyAiRevision } = useAiRevision(state);
  const { applyTemplate, freshIds } = useTemplateSwitch(state);

  useBuilderShortcuts({
    selectedId: state.selectedId,
    editingId: state.editingId,
    canSave: !isDemo && state.isDirty && !saving && !publishing,
    save: handleSave,
    openInsert: () => setInsertOpen(true),
    openShortcuts: () => setShortcutsOpen(true),
    openPreview: () => setPreviewOpen(true),
    remove: removeField,
    duplicate: duplicateField,
    move: moveFieldBy,
    closeProperties: () => state.setEditingId(null),
    deselect: () => state.setSelectedId(null),
  });

 
  const hasPaymentField = Boolean(findPaymentField(state.fields));
  useEffect(() => {
    if (!hasPaymentField || isDemo) return;
    const load = () => {
      getPaymentSettings(workspaceId).then(setPaymentSettings).catch(() => {});
    };
    load();
    return onReturnFromConnections(load);
  }, [hasPaymentField, workspaceId, isDemo]);

  function handleRailSelect(panel: RailPanel) {
    if (panel === 'integrations') {
      openConnections();
      return;
    }
    if (panel === 'templates') {
      setTemplatesOpen(true);
      return;
    }
    if (panel !== 'embed') {
      setRailPanel(panel);
      return;
    }
    if (isDemo) {
      notify.warn('Sample forms have no share link — create a form in your own workspace to embed it');
      return;
    }
    if (!state.savedFormId) {
      notify.warn('Save the form first to get its embed code');
      return;
    }
    setShareOpen(true);
  }

  function handleBack() {
    if (state.isDirty) {
      setPendingLeave(true);
      return;
    }
    navigate(`/${workspaceId}/forms`);
  }

  const editingField = state.editingId ? findField(state.fields, state.editingId) : null;

  const drawers = (
    <BuilderDrawers
      state={state}
      workspaceId={workspaceId}
      isDemo={isDemo}
      editingField={editingField}
      paymentSettings={paymentSettings}
      railPanel={railPanel}
      setRailPanel={setRailPanel}
      formSettingsOpen={formSettingsOpen}
      setFormSettingsOpen={setFormSettingsOpen}
      shareOpen={shareOpen}
      setShareOpen={setShareOpen}
      publishedOpen={publishedOpen}
      setPublishedOpen={setPublishedOpen}
      previewOpen={previewOpen}
      setPreviewOpen={setPreviewOpen}
      pendingLeave={pendingLeave}
      setPendingLeave={setPendingLeave}
      onLeave={() => navigate(`/${workspaceId}/forms`)}
      updateField={updateField}
      aiSnapshot={aiSnapshot}
      applyAiRevision={applyAiRevision}
    />
  );

  const insertModal = (
    <QuickInsertModal
      opened={insertOpen}
      onClose={() => setInsertOpen(false)}
      onPick={(item) => insertFieldAfter(item.type, item.columns, state.selectedId)}
    />
  );

  if (tooSmall) {
    return (
      <>
        <MobileBuilder
          state={state}
          actions={{ onChange: updateField, onMove: moveFieldBy, onDuplicate: duplicateField, onRemove: removeField }}
          isDemo={isDemo}
          saving={saving}
          publishing={publishing}
          onBack={handleBack}
          onSave={handleSave}
          onTogglePublish={handleTogglePublish}
          onAddField={() => setInsertOpen(true)}
          onAskAi={() => setRailPanel('ai')}
        />
        {drawers}
        {insertModal}
      </>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={(event) => setDragging((event.active.data.current as DragData) ?? null)}
      onDragCancel={() => setDragging(null)}
      onDragEnd={handleDragEnd}
    >
      <AppShell
        header={{ height: 52 }}
        navbar={{ width: 312, breakpoint: 'sm', collapsed: { mobile: !navOpened } }}
        aside={{ width: 56, breakpoint: 'sm' }}
        padding={0}
        classNames={{ main: classes.main }}
      >
        <BuilderHeader
          name={state.name}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          savedForm={state.savedForm}
          isDirty={state.isDirty}
          isDemo={isDemo}
          embedded={embedded}
          navOpened={navOpened}
          onToggleNav={toggleNav}
          onBack={handleBack}
          undo={state.undo}
          redo={state.redo}
          canUndo={state.canUndo}
          canRedo={state.canRedo}
          onPreview={() => setPreviewOpen(true)}
          onSave={handleSave}
          onTogglePublish={handleTogglePublish}
          saving={saving}
          publishing={publishing}
        />

        <AppShell.Navbar>
          <FieldPalette
            onAdd={(type, columns) => {
              insertFieldAfter(type, columns, state.selectedId);
              closeNav();
            }}
          />
        </AppShell.Navbar>

        <AppShell.Main>
          {state.loadingForm ? (
            <Stack gap="md" maw={640} mx="auto" py="xl" px="md">
              <Skeleton height={32} width="50%" />
              <Skeleton height={16} width="70%" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} height={70} radius="md" />
              ))}
            </Stack>
          ) : (
            <FormCanvas
              title={state.title}
              description={state.description}
              fields={state.fields}
              selectedId={state.selectedId}
              onSelect={state.setSelectedId}
              onDeselect={() => state.setSelectedId(null)}
              onRemove={removeField}
              onDuplicate={duplicateField}
              onOpenProperties={state.setEditingId}
              onOpenFormSettings={() => setFormSettingsOpen(true)}
              onTitleChange={state.setTitle}
              onDescriptionChange={state.setDescription}
              onFieldChange={updateField}
              onInsertAt={(item, index) => insertFieldAt(item.type, item.columns, index)}
              onQuickAdd={(type) => addField(type)}
              onAskAi={() => setRailPanel('ai')}
              onOpenInsert={() => setInsertOpen(true)}
              onOpenTemplates={() => setTemplatesOpen(true)}
              freshIds={freshIds}
              submitLabel={state.submitLabel}
              onSubmitLabelChange={state.setSubmitLabel}
              submitButtonWidth={state.submitButtonWidth}
              submitButtonAlign={state.submitButtonAlign}
              submitButtonSize={state.submitButtonSize}
              hideHeader={state.hideHeader}
              headerAlign={state.headerAlign}
              onHideHeader={() => state.setHideHeader(true)}
              offsetRight={!!state.editingId || railPanel === 'ai'}
              theme={state.theme}
            />
          )}
        </AppShell.Main>

        <AppShell.Aside>
          <IconRail active={railPanel} onSelect={handleRailSelect} />
        </AppShell.Aside>

        {drawers}
      </AppShell>

      {insertModal}
      <ShortcutsModal opened={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      {templatesOpen && (
        <TemplateSwitcher
          onClose={() => setTemplatesOpen(false)}
          fields={state.fields}
          theme={state.theme}
          onApply={applyTemplate}
          current={{
            title: state.title,
            description: state.description,
            fields: state.fields,
            hideHeader: state.hideHeader,
            headerAlign: state.headerAlign,
            labelPlacement: state.labelPlacement,
            submitLabel: state.submitLabel,
            submitButtonSize: state.submitButtonSize,
            submitButtonWidth: state.submitButtonWidth,
            submitButtonAlign: state.submitButtonAlign,
            theme: state.theme,
            steps: state.steps,
            stepIndicator: state.stepIndicator,
            showStepHeadings: state.showStepHeadings,
            oneQuestionAtATime: state.oneQuestionAtATime,
          }}
        />
      )}

      <DragOverlay dropAnimation={null}>
        {dragging ? <DragChip data={dragging} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

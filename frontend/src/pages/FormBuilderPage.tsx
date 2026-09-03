import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { AppShell, Stack, Skeleton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { getPaymentSettings } from '@/lib/api';
import { findPaymentField } from '@/lib/payment';
import { isDemoWorkspace } from '@/lib/demoWorkspace';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { useEmbedded } from '@/hooks/useEmbedded';
import type { PaymentSettings } from '@/types';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { paletteByKey, paletteByType } from '@/lib/fieldPalette';
import { findField } from '@/lib/fieldTree';
import type { DragData } from '@/components/builder/dnd';
import { FieldPalette } from '@/components/builder/FieldPalette';
import { FormCanvas } from '@/components/builder/FormCanvas';
import { IconRail, type RailPanel } from '@/components/builder/IconRail';
import { useFormBuilderState, type BuilderLocationState } from './formBuilder/useFormBuilderState';
import { useFieldOps } from './formBuilder/useFieldOps';
import { useFormPersistence } from './formBuilder/useFormPersistence';
import { useAiRevision } from './formBuilder/useAiRevision';
import { BuilderHeader } from './formBuilder/BuilderHeader';
import { BuilderDrawers } from './formBuilder/BuilderDrawers';
import classes from './FormBuilderPage.module.css';

export function FormBuilderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: routeFormId } = useParams<{ id: string }>();
  const workspaceId = useWorkspaceId();
  const isDemo = isDemoWorkspace(workspaceId);
  const embedded = useEmbedded();
  const locationState = (location.state as BuilderLocationState | null) ?? null;

  const state = useFormBuilderState({ routeFormId, workspaceId, isDemo, locationState });

  // Local-only UI state that never needs snapshotting.
  const [formSettingsOpen, setFormSettingsOpen] = useState(false);
  const [railPanel, setRailPanel] = useState<RailPanel | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure(false);
  const [dragging, setDragging] = useState<DragData | null>(null);
  const [pendingLeave, setPendingLeave] = useState(false);

  // A few pixels of travel before a drag starts, so clicking a field to open
  // its properties is not read as the beginning of one.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const { addField, updateField, removeField, duplicateField, handleDragEnd } = useFieldOps({
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
    setRailPanel,
  });

  const { aiSnapshot, applyAiRevision } = useAiRevision(state);

 
  const hasPaymentField = Boolean(findPaymentField(state.fields));
  useEffect(() => {
    if (!hasPaymentField || isDemo || railPanel === 'payments') return;
    getPaymentSettings(workspaceId).then(setPaymentSettings).catch(() => {});
  }, [hasPaymentField, workspaceId, isDemo, railPanel]);

  function handleRailSelect(panel: RailPanel) {
    if (panel !== 'embed') {
      setRailPanel(panel);
      return;
    }
    if (isDemo) {
      notifications.show({
        message:
          'Sample forms have no share link — create a form in your own workspace to embed it',
        color: 'yellow',
      });
      return;
    }
    if (!state.savedFormId) {
      notifications.show({ message: 'Save the form first to get its embed code', color: 'yellow' });
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
          savedForm={state.savedForm}
          isDirty={state.isDirty}
          isDemo={isDemo}
          embedded={embedded}
          loadingForm={state.loadingForm}
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
              addField(type, columns);
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
          previewOpen={previewOpen}
          setPreviewOpen={setPreviewOpen}
          pendingLeave={pendingLeave}
          setPendingLeave={setPendingLeave}
          onLeave={() => navigate(`/${workspaceId}/forms`)}
          updateField={updateField}
          aiSnapshot={aiSnapshot}
          applyAiRevision={applyAiRevision}
        />
      </AppShell>
 
      <DragOverlay dropAnimation={null}>
        {dragging ? (
          <div className={classes.dragChip}>
            {dragging.kind === 'palette'
              ? paletteByKey[dragging.paletteKey]?.label ?? 'Field'
              : dragging.field.label || paletteByType[dragging.field.type]?.label || 'Field'}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

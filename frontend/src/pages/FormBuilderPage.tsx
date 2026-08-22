import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import { AppShell, Group, TextInput, Button, ThemeIcon, ActionIcon, Tooltip } from '@mantine/core';
import { IconFileText, IconEye, IconArrowLeft } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { createForm, getForm, updateForm } from '@/lib/api';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { useEmbedded } from '@/hooks/useEmbedded';
import type { Form, FormField, FieldType, LabelPlacement, SubmitButtonSize } from '@/types';
import { ShareModal } from '@/components/share/ShareModal';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { makeField, paletteByKey, paletteByType } from '@/lib/fieldPalette';
import {
  cloneWithNewIds,
  findField,
  insertIntoColumn,
  locateField,
  removeFromTree,
  updateInTree,
} from '@/lib/fieldTree';
import { parseColumnDroppableId, type DragData } from '@/components/builder/dnd';
import { FieldPalette } from '@/components/builder/FieldPalette';
import { FormCanvas } from '@/components/builder/FormCanvas';
import { FormSettings } from '@/components/builder/FormSettings';
import { PropertiesDrawer } from '@/components/builder/PropertiesDrawer';
import { IconRail, type RailPanel } from '@/components/builder/IconRail';
import { ThankYouDrawer } from '@/components/builder/ThankYouDrawer';
import { QuickSettingsDrawer } from '@/components/builder/QuickSettingsDrawer';
import { PreviewModal } from '@/components/builder/PreviewModal';
import classes from './FormBuilderPage.module.css';

export function FormBuilderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: routeFormId } = useParams<{ id: string }>();
  const workspaceId = useWorkspaceId();
  const embedded = useEmbedded();
  const initialTitle = (location.state as { title?: string } | null)?.title ?? 'Untitled form';
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSettingsOpen, setFormSettingsOpen] = useState(false);
  const [railPanel, setRailPanel] = useState<RailPanel | null>(null);
  const [thankYouMessage, setThankYouMessage] = useState(
    'Thanks! Your response has been recorded.'
  );
  const [redirectUrl, setRedirectUrl] = useState('');
  const [hideHeader, setHideHeader] = useState(false);
  const [labelPlacement, setLabelPlacement] = useState<LabelPlacement>('top');
  const [submitLabel, setSubmitLabel] = useState('');
  const [submitButtonSize, setSubmitButtonSize] = useState<SubmitButtonSize>('medium');
  const [collectIp, setCollectIp] = useState(false);
  const [savedFormId, setSavedFormId] = useState<string | null>(routeFormId ?? null);
  const [savedForm, setSavedForm] = useState<Form | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState<DragData | null>(null);

  // A few pixels of travel before a drag starts, so clicking a field to open
  // its properties is not read as the beginning of one.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!routeFormId) return;
    getForm(routeFormId, workspaceId).then((form) => {
      setSavedForm(form);
      setTitle(form.title);
      setDescription(form.description ?? '');
      setFields(form.fields);
      setRedirectUrl(form.redirectUrl ?? '');
      setHideHeader(form.hideHeader ?? false);
      setLabelPlacement(form.labelPlacement ?? 'top');
      setSubmitLabel(form.submitLabel ?? '');
      setSubmitButtonSize(form.submitButtonSize ?? 'medium');
      setCollectIp(form.collectIp ?? false);
      if (form.thankYouMessage) setThankYouMessage(form.thankYouMessage);
    });
  }, [routeFormId, workspaceId]);

  function addField(type: FieldType, columns?: number) {
    const field = makeField(type, columns);
    setFields((prev) => [...prev, field]);
    setSelectedId(field.id);
  }

  function updateField(id: string, patch: Partial<FormField>) {
    setFields((prev) => updateInTree(prev, id, patch));
  }

  function removeField(id: string) {
    setFields((prev) => removeFromTree(prev, id));
    if (selectedId === id) setSelectedId(null);
  }

  function duplicateField(id: string) {
    setFields((prev) => {
      const source = findField(prev, id);
      if (!source) return prev;
      // A fresh id for the copy and for everything inside it, or the tree would
      // hold the same id twice and dnd-kit would address both at once.
      const copy = cloneWithNewIds(source);
      const place = locateField(prev, id);
      if (place && 'gridId' in place) {
        return insertIntoColumn(prev, place.gridId, place.columnIndex, copy, place.index + 1);
      }
      const index = prev.findIndex((f) => f.id === id);
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });
  }

  /**
   * Resolves a drop into a new tree.
   *
   * Both a palette tile and an existing row land here — the first creates a
   * field, the second moves the one being dragged out of wherever it was.
   */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDragging(null);
    if (!over) return;

    const data = active.data.current as DragData | undefined;
    if (!data) return;

    const field =
      data.kind === 'palette'
        ? (() => {
            const item = paletteByKey[data.paletteKey];
            return item ? makeField(item.type, item.columns) : null;
          })()
        : data.field;
    if (!field) return;

    // A grid cannot be dropped into a column: one level of nesting is what the
    // layout is for, and deeper would render columns too narrow to use.
    const overColumn = parseColumnDroppableId(String(over.id));
    if (field.type === 'grid' && overColumn) return;

    setFields((prev) => {
      // Moving: lift it out first so the insert index counts the same list the
      // drop was measured against.
      const without = data.kind === 'field' ? removeFromTree(prev, field.id) : prev;

      if (overColumn) {
        return insertIntoColumn(without, overColumn.gridId, overColumn.columnIndex, field);
      }

      // Dropped on another row: take that row's place.
      const overPlace = locateField(without, String(over.id));
      if (overPlace && 'gridId' in overPlace) {
        return insertIntoColumn(
          without,
          overPlace.gridId,
          overPlace.columnIndex,
          field,
          overPlace.index
        );
      }
      if (overPlace) {
        const next = [...without];
        next.splice(overPlace.index, 0, field);
        return next;
      }

      // The card itself: append.
      return [...without, field];
    });

    setSelectedId(field.id);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      title,
      description,
      fields,
      redirectUrl,
      thankYouMessage,
      hideHeader,
      labelPlacement,
      submitLabel,
      submitButtonSize,
      collectIp,
    };
    const form = savedFormId
      ? await updateForm(savedFormId, payload, workspaceId)
      : await createForm(payload, workspaceId);
    setSaving(false);
    setSavedFormId(form._id);
    setSavedForm(form);
    notifications.show({ message: 'Form saved', color: 'emerald' });
    if (!savedFormId) setShareOpen(true);
  }

  function handleRailSelect(panel: RailPanel) {
    if (panel !== 'embed') {
      setRailPanel(panel);
      return;
    }
    if (!savedFormId) {
      notifications.show({ message: 'Save the form first to get its embed code', color: 'yellow' });
      return;
    }
    setShareOpen(true);
  }

  const editingField = editingId ? findField(fields, editingId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={(event) => setDragging((event.active.data.current as DragData) ?? null)}
      onDragCancel={() => setDragging(null)}
      onDragEnd={handleDragEnd}
    >
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm' }}
      aside={{ width: 52, breakpoint: 'sm' }}
      padding={0}
      classNames={{ main: classes.main }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
            <Tooltip label="Back to all forms" position="bottom" withArrow>
              <ActionIcon
                component={Link}
                to={`/${workspaceId}/forms`}
                variant="subtle"
                color="gray"
                size="lg"
                aria-label="Back to all forms"
              >
                <IconArrowLeft size={19} />
              </ActionIcon>
            </Tooltip>
            {/* The app icon is the host's job when embedded. */}
            {!embedded && (
              <ThemeIcon variant="light" color="gray" radius="sm">
                <IconFileText size={18} />
              </ThemeIcon>
            )}
            <TextInput
              variant="unstyled"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fw={600}
              size="md"
              style={{ flex: 1, maxWidth: 400 }}
            />
          </Group>
          <Group gap="xs">
            <Button
              variant="default"
              radius="md"
              leftSection={<IconEye size={16} />}
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </Button>
            <Button color="emerald" radius="md" onClick={handleSave} loading={saving}>
              {savedFormId ? 'Save' : 'Access Form'}
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <FieldPalette onAdd={addField} />
      </AppShell.Navbar>

      <AppShell.Main>
        <FormCanvas
          title={title}
          description={description}
          fields={fields}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRemove={removeField}
          onDuplicate={duplicateField}
          onOpenProperties={setEditingId}
          onOpenFormSettings={() => setFormSettingsOpen(true)}
          hideHeader={hideHeader}
          onHideHeader={() => setHideHeader(true)}
          offsetRight={!!editingId}
        />
      </AppShell.Main>

      <PropertiesDrawer field={editingField} onClose={() => setEditingId(null)} onChange={updateField} />

      <FormSettings
        opened={formSettingsOpen}
        onClose={() => setFormSettingsOpen(false)}
        title={title}
        description={description}
        hideHeader={hideHeader}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onHideHeaderChange={setHideHeader}
      />

      <AppShell.Aside>
        <IconRail active={railPanel} onSelect={handleRailSelect} />
      </AppShell.Aside>

      <QuickSettingsDrawer
        opened={railPanel === 'quickSettings'}
        onClose={() => setRailPanel(null)}
        settings={{ hideHeader, labelPlacement, submitLabel, submitButtonSize, collectIp }}
        onChange={(patch) => {
          if (patch.hideHeader !== undefined) setHideHeader(patch.hideHeader);
          if (patch.labelPlacement) setLabelPlacement(patch.labelPlacement);
          if (patch.submitLabel !== undefined) setSubmitLabel(patch.submitLabel);
          if (patch.submitButtonSize) setSubmitButtonSize(patch.submitButtonSize);
          if (patch.collectIp !== undefined) setCollectIp(patch.collectIp);
        }}
      />

      <ThankYouDrawer
        opened={railPanel === 'thankYou'}
        onClose={() => setRailPanel(null)}
        thankYouMessage={thankYouMessage}
        redirectUrl={redirectUrl}
        onThankYouChange={setThankYouMessage}
        onRedirectChange={setRedirectUrl}
      />

      <PreviewModal
        opened={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        description={description}
        fields={fields}
        hideHeader={hideHeader}
        labelPlacement={labelPlacement}
        submitLabel={submitLabel}
        submitButtonSize={submitButtonSize}
      />

      {savedForm && (
        <ShareModal
          opened={shareOpen}
          onClose={() => setShareOpen(false)}
          form={savedForm}
          onStatusChange={(status) => setSavedForm({ ...savedForm, status })}
        />
      )}
    </AppShell>

      {/* Follows the cursor so the drag has something to carry — without it a
          palette tile appears to do nothing until it lands. */}
      <DragOverlay dropAnimation={null}>
        {dragging ? (
          <div className={classes.dragChip}>
            {dragging.kind === 'palette'
              ? (paletteByKey[dragging.paletteKey]?.label ?? 'Field')
              : dragging.field.label || paletteByType[dragging.field.type]?.label || 'Field'}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

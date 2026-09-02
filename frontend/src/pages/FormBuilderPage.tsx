import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { AppShell, Group, TextInput, Button, ThemeIcon, ActionIcon, Tooltip, Modal, Text, Stack, Skeleton, Burger, Badge, Divider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFileText, IconEye, IconEyeOff, IconWorld, IconArrowLeft, IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { createForm, getForm, updateForm, getPaymentSettings } from '@/lib/api';
import { findPaymentField, paymentFieldProblem, paymentStepProblem } from '@/lib/payment';
import { getDemoForm, isDemoWorkspace } from '@/lib/demoWorkspace';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';
import { useEmbedded } from '@/hooks/useEmbedded';
import type { Form, FormField, FieldType, FormStep, StepIndicator, LabelPlacement, SubmitButtonSize, SubmitButtonWidth, SubmitButtonAlign, FormTheme, NotificationSettings, PaymentSettings, FormSchedule } from '@/types';
import { NotificationsModal } from '@/components/builder/NotificationsModal';
import { PaymentsModal } from '@/components/builder/PaymentsModal';
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
import { AiEditDrawer, type CurrentFormSnapshot } from '@/components/builder/AiEditDrawer';
import { generatedToTemplate, type GeneratedForm } from '@/lib/generatedForm';
import { ThankYouDrawer } from '@/components/builder/ThankYouDrawer';
import { QuickSettingsDrawer } from '@/components/builder/QuickSettingsDrawer';
import { ThemeDrawer } from '@/components/builder/ThemeDrawer';
import { StepsDrawer } from '@/components/builder/StepsDrawer';
import { PreviewModal } from '@/components/builder/PreviewModal';
import { useUndoHistory } from '@/hooks/useUndoHistory';
import classes from './FormBuilderPage.module.css';

interface EditableState {
  name: string;
  title: string;
  description: string;
  fields: FormField[];
  redirectUrl: string;
  thankYouMessage: string;
  hideHeader: boolean;
  headerAlign: SubmitButtonAlign;
  labelPlacement: LabelPlacement;
  submitLabel: string;
  submitButtonSize: SubmitButtonSize;
  submitButtonWidth: SubmitButtonWidth;
  submitButtonAlign: SubmitButtonAlign;
  theme: FormTheme;
  steps: FormStep[];
  stepIndicator: StepIndicator;
  showStepHeadings: boolean;
  collectIp: boolean;
  requireCaptcha: boolean;
  collectPartials: boolean;
  allowEdit: boolean;
  schedule?: FormSchedule;
  notifications: NotificationSettings;
}

export function FormBuilderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: routeFormId } = useParams<{ id: string }>();
  const workspaceId = useWorkspaceId();
  const isDemo = isDemoWorkspace(workspaceId);
  const embedded = useEmbedded();
  const locationState = location.state as
    | {
        title?: string;
        themeScope?: FormTheme['scope'];
        templateFields?: FormField[];
        templateDescription?: string;
        templateTheme?: FormTheme;
        templateSubmitLabel?: string;
        templateHideHeader?: boolean;
      }
    | null;
  const initialTitle = locationState?.title ?? 'Untitled form';
  const [name, setName] = useState(initialTitle);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(locationState?.templateDescription ?? '');
  const [fields, setFields] = useState<FormField[]>(
    () => locationState?.templateFields?.map(cloneWithNewIds) ?? []
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSettingsOpen, setFormSettingsOpen] = useState(false);
  const [railPanel, setRailPanel] = useState<RailPanel | null>(null);
  // Only fetched once the form actually has a payment field — a form that
  // charges nothing has no reason to ask about Razorpay.
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [thankYouMessage, setThankYouMessage] = useState(
    'Thanks! Your response has been recorded.'
  );
  const [redirectUrl, setRedirectUrl] = useState('');
  const [hideHeader, setHideHeader] = useState(locationState?.templateHideHeader ?? false);
  const [headerAlign, setHeaderAlign] = useState<SubmitButtonAlign>('left');
  const [labelPlacement, setLabelPlacement] = useState<LabelPlacement>('top');
  const [submitLabel, setSubmitLabel] = useState(locationState?.templateSubmitLabel ?? '');
  const [submitButtonSize, setSubmitButtonSize] = useState<SubmitButtonSize>('medium');
  const [submitButtonWidth, setSubmitButtonWidth] = useState<SubmitButtonWidth>(100);
  const [submitButtonAlign, setSubmitButtonAlign] = useState<SubmitButtonAlign>('left');
  const [theme, setTheme] = useState<FormTheme>(
    locationState?.templateTheme ?? { scope: locationState?.themeScope ?? 'page' }
  );
  const [steps, setSteps] = useState<FormStep[]>([]);
  const [stepIndicator, setStepIndicator] = useState<StepIndicator>('progress');
  const [showStepHeadings, setShowStepHeadings] = useState(false);
  const [collectIp, setCollectIp] = useState(false);
  const [requireCaptcha, setRequireCaptcha] = useState(false);
  const [collectPartials, setCollectPartials] = useState(false);
  const [allowEdit, setAllowEdit] = useState(false);
  const [schedule, setSchedule] = useState<FormSchedule | undefined>(undefined);
  const [emailNotifications, setEmailNotifications] = useState<NotificationSettings>({});
  const [savedFormId, setSavedFormId] = useState<string | null>(routeFormId ?? null);
  const [loadingForm, setLoadingForm] = useState(!!routeFormId);
  const [savedForm, setSavedForm] = useState<Form | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure(false);
  const [dragging, setDragging] = useState<DragData | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [pendingLeave, setPendingLeave] = useState(false);

  // A few pixels of travel before a drag starts, so clicking a field to open
  // its properties is not read as the beginning of one.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Everything that ends up in the save payload, serialized — comparing this
  // against the last-saved snapshot is what "unsaved changes" means here.
  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        name,
        title,
        description,
        fields,
        redirectUrl,
        thankYouMessage,
        hideHeader,
        headerAlign,
        labelPlacement,
        submitLabel,
        submitButtonSize,
        submitButtonWidth,
        submitButtonAlign,
        theme,
        steps,
        stepIndicator,
        showStepHeadings,
        collectIp,
        requireCaptcha,
        collectPartials,
        allowEdit,
        schedule,
        notifications: emailNotifications,
      }),
    [
      name,
      title,
      description,
      fields,
      redirectUrl,
      thankYouMessage,
      hideHeader,
      headerAlign,
      labelPlacement,
      submitLabel,
      theme,
      submitButtonSize,
      submitButtonWidth,
      submitButtonAlign,
      steps,
      stepIndicator,
      showStepHeadings,
      collectIp,
      requireCaptcha,
      collectPartials,
      allowEdit,
      schedule,
      emailNotifications,
    ]
  );
  // In the demo workspace nothing can be saved, so nothing is ever "unsaved" —
  // that keeps the leave prompt and the beforeunload warning out of a tour.
  const isDirty = !isDemo && currentSnapshot !== savedSnapshot;

  const editableState: EditableState = useMemo(
    () => ({
      name,
      title,
      description,
      fields,
      redirectUrl,
      thankYouMessage,
      hideHeader,
      headerAlign,
      labelPlacement,
      submitLabel,
      submitButtonSize,
      submitButtonWidth,
      submitButtonAlign,
      theme,
      steps,
      stepIndicator,
      showStepHeadings,
      collectIp,
      requireCaptcha,
      collectPartials,
      allowEdit,
      schedule,
      notifications: emailNotifications,
    }),
    [
      name,
      title,
      description,
      fields,
      redirectUrl,
      thankYouMessage,
      hideHeader,
      headerAlign,
      labelPlacement,
      submitLabel,
      submitButtonSize,
      submitButtonWidth,
      submitButtonAlign,
      theme,
      steps,
      stepIndicator,
      showStepHeadings,
      collectIp,
      requireCaptcha,
      collectPartials,
      allowEdit,
      schedule,
      emailNotifications,
    ]
  );

  const applyEditableState = useCallback((state: EditableState) => {
    setName(state.name);
    setTitle(state.title);
    setDescription(state.description);
    setFields(state.fields);
    setRedirectUrl(state.redirectUrl);
    setThankYouMessage(state.thankYouMessage);
    setHideHeader(state.hideHeader);
    setHeaderAlign(state.headerAlign);
    setLabelPlacement(state.labelPlacement);
    setSubmitLabel(state.submitLabel);
    setSubmitButtonSize(state.submitButtonSize);
    setSubmitButtonWidth(state.submitButtonWidth);
    setSubmitButtonAlign(state.submitButtonAlign);
    setTheme(state.theme);
    setSteps(state.steps);
    setStepIndicator(state.stepIndicator);
    setShowStepHeadings(state.showStepHeadings);
    setCollectIp(state.collectIp);
    setRequireCaptcha(state.requireCaptcha);
    setCollectPartials(state.collectPartials);
    setAllowEdit(state.allowEdit);
    setSchedule(state.schedule);
    setEmailNotifications(state.notifications);
    // The selected/editing field may not exist in this snapshot's tree.
    setSelectedId((id) => (id && findField(state.fields, id) ? id : null));
    setEditingId((id) => (id && findField(state.fields, id) ? id : null));
  }, []);

  const { undo, redo, canUndo, canRedo } = useUndoHistory(
    editableState,
    JSON.stringify,
    applyEditableState,
    // Re-seeds history once the real form data has loaded in (async, after
    // mount) — without this the first snapshot is the pre-load empty state.
    { resetKey: savedForm?._id }
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMeta = e.ctrlKey || e.metaKey;
      if (!isMeta) return;
      // A text input mid-edit should keep its own native undo, not the
      // builder's structural one — otherwise typing and Ctrl+Z fight.
      const target = e.target as HTMLElement;
      const isEditable =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isEditable) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // A browser-level close/refresh/tab-nav can't be intercepted with a custom
  // dialog — this is the one native hook that still warns the respondent.
  useEffect(() => {
    if (!isDirty) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!routeFormId) return;
    // A demo form is built into the app, so it loads without a request — the
    // rest of the editor then works on it exactly as on a stored form, minus
    // saving.
    const demo = isDemo ? getDemoForm(routeFormId) : undefined;
    const source = demo ? Promise.resolve(demo) : getForm(routeFormId, workspaceId);
    source.then((form) => {
      setSavedForm(form);
      setName(form.name || form.title);
      setTitle(form.title);
      setDescription(form.description ?? '');
      setFields(form.fields);
      setRedirectUrl(form.redirectUrl ?? '');
      setHideHeader(form.hideHeader ?? false);
      setHeaderAlign(form.headerAlign ?? 'center');
      setLabelPlacement(form.labelPlacement ?? 'top');
      setSubmitLabel(form.submitLabel ?? '');
      setSubmitButtonSize(form.submitButtonSize ?? 'medium');
      setSubmitButtonWidth(form.submitButtonWidth ?? 100);
      setSubmitButtonAlign(form.submitButtonAlign ?? 'center');
      setTheme(form.theme ?? { scope: 'page' });
      setSteps(form.steps ?? []);
      setStepIndicator(form.stepIndicator ?? 'progress');
      setShowStepHeadings(form.showStepHeadings ?? false);
      setCollectIp(form.collectIp ?? false);
      setRequireCaptcha(form.requireCaptcha ?? false);
      setCollectPartials(form.collectPartials ?? false);
      setAllowEdit(form.allowEdit ?? false);
      setSchedule(form.schedule);
      setEmailNotifications(form.notifications ?? {});
      if (form.thankYouMessage) setThankYouMessage(form.thankYouMessage);
      setSavedSnapshot(
        JSON.stringify({
          name: form.name,
          title: form.title,
          description: form.description ?? '',
          fields: form.fields,
          redirectUrl: form.redirectUrl ?? '',
          thankYouMessage: form.thankYouMessage || 'Thanks! Your response has been recorded.',
          hideHeader: form.hideHeader ?? false,
          headerAlign: form.headerAlign ?? 'center',
          labelPlacement: form.labelPlacement ?? 'top',
          submitLabel: form.submitLabel ?? '',
          submitButtonSize: form.submitButtonSize ?? 'medium',
          submitButtonWidth: form.submitButtonWidth ?? 100,
          submitButtonAlign: form.submitButtonAlign ?? 'center',
          theme: form.theme ?? { scope: 'page' },
          steps: form.steps ?? [],
          stepIndicator: form.stepIndicator ?? 'progress',
          showStepHeadings: form.showStepHeadings ?? false,
          collectIp: form.collectIp ?? false,
          requireCaptcha: form.requireCaptcha ?? false,
          collectPartials: form.collectPartials ?? false,
          allowEdit: form.allowEdit ?? false,
          schedule: form.schedule,
          notifications: form.notifications ?? {},
        })
      );
      setLoadingForm(false);
    }).catch(() => {
      setLoadingForm(false);
      notifications.show({ message: 'Could not load this form', color: 'red' });
      navigate(`/${workspaceId}/forms`);
    });
  }, [routeFormId, workspaceId, isDemo, navigate]);

  /**
   * Whether this workspace can actually take money.
   *
   * Fetched only once the form has a payment field on it, and refetched when
   * the payments modal closes — the field's own panel shows this status, and
   * would otherwise keep claiming "not connected" right after someone
   * connected an account.
   */
  const hasPaymentField = Boolean(findPaymentField(fields));
  useEffect(() => {
    if (!hasPaymentField || isDemo || railPanel === 'payments') return;
    getPaymentSettings(workspaceId).then(setPaymentSettings).catch(() => {});
  }, [hasPaymentField, workspaceId, isDemo, railPanel]);

  // A brand-new, never-saved form: its own starting state is "clean" — the
  // save button should stay disabled until something actually changes.
  // Skipped when a template pre-filled it: that's already a change worth
  // saving, not a blank slate.
  useEffect(() => {
    if (routeFormId || locationState) return;
    setSavedSnapshot(currentSnapshot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeFormId]);

  /**
   * A form charges once, so it carries one payment field.
   *
   * Refused here rather than at submit: a second one would silently never be
   * charged, since the backend takes the first it finds.
   */
  function refusesSecondPayment(type: FieldType): boolean {
    if (type !== 'payment' || !findPaymentField(fields)) return false;
    notifications.show({
      message: 'A form can only take one payment. Edit the payment field you already have.',
      color: 'orange',
    });
    return true;
  }

  function addField(type: FieldType, columns?: number) {
    if (refusesSecondPayment(type)) return;
    const field = makeField(type, columns);
    setFields((prev) => [...prev, field]);
    setSelectedId(field.id);
  }

  function updateField(id: string, patch: Partial<FormField>) {
    setFields((prev) => updateInTree(prev, id, patch));
  }

  function removeField(id: string) {
    const next = removeFromTree(fields, id);
    setFields(next);
    // Checked against the new tree rather than by comparing ids: deleting a
    // grid takes its columns' fields with it, so the field being edited may be
    // gone without being the one that was deleted. Left open, the drawer would
    // describe a field that no longer exists and patch nothing.
    if (selectedId && !findField(next, selectedId)) setSelectedId(null);
    if (editingId && !findField(next, editingId)) setEditingId(null);
  }

  function duplicateField(id: string) {
    setFields((prev) => {
      const source = findField(prev, id);
      if (!source) return prev;
      // Copying the payment field would give the form two, and only the first
      // would ever charge.
      if (source.type === 'payment') {
        notifications.show({
          message: 'A form can only take one payment.',
          color: 'orange',
        });
        return prev;
      }
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
            if (!item || refusesSecondPayment(item.type)) return null;
            return makeField(item.type, item.columns);
          })()
        : data.field;
    if (!field) return;

    // A grid cannot be dropped into a column: one level of nesting is what the
    // layout is for, and deeper would render columns too narrow to use.
    // A page break is refused too — pages split the whole form, not a column.
    const overColumn = parseColumnDroppableId(String(over.id));
    if ((field.type === 'grid' || field.type === 'pageBreak') && overColumn) return;

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

  async function saveForm() {
    // Belt and braces alongside the hidden buttons: a keyboard shortcut or a
    // stale handler must not send a write the backend will refuse anyway.
    if (isDemo) throw new Error('The demo workspace is read-only');
    const payload = {
      name,
      title,
      description,
      fields,
      redirectUrl,
      thankYouMessage,
      hideHeader,
      headerAlign,
      labelPlacement,
      submitLabel,
      submitButtonSize,
      submitButtonWidth,
      submitButtonAlign,
      theme,
      steps,
      stepIndicator,
      showStepHeadings,
      collectIp,
      requireCaptcha,
      collectPartials,
      allowEdit,
      schedule,
      notifications: emailNotifications,
    };
    const form = savedFormId
      ? await updateForm(savedFormId, payload, workspaceId)
      : await createForm(payload, workspaceId);
    setSavedFormId(form._id);
    setSavedForm(form);
    setSavedSnapshot(currentSnapshot);
    return form;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const form = await saveForm();
      notifications.show({ message: 'Form saved', color: 'emerald' });
      if (!savedFormId) setShareOpen(true);
      return form;
    } catch {
      notifications.show({ message: 'Could not save form', color: 'red' });
      return undefined;
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish() {
    // Publishing is the last point before real respondents reach this. A
    // payment field with no amount, or one priced off a deleted field, fails
    // at submit — after someone has filled the whole form in.
    const payField = findPaymentField(fields);
    if (payField && savedForm?.status !== 'published') {
      const problem = paymentFieldProblem(payField, fields) ?? paymentStepProblem(fields);
      if (problem) {
        notifications.show({
          title: 'Fix the payment field first',
          message: problem,
          color: 'orange',
        });
        setSelectedId(payField.id);
        setEditingId(payField.id);
        return;
      }
      if (!paymentSettings?.enabled) {
        notifications.show({
          title: 'Payments are switched off',
          message: 'Connect Razorpay and turn payments on, or this form cannot charge anyone.',
          color: 'orange',
        });
        setRailPanel('payments');
        return;
      }
    }

    setPublishing(true);
    try {
      const base = isDirty || !savedFormId ? await saveForm() : savedForm;
      if (!base) return;
      const nextStatus = base.status === 'published' ? 'draft' : 'published';
      const updated = await updateForm(base._id, { status: nextStatus }, workspaceId);
      setSavedForm(updated);
      notifications.show({
        message: nextStatus === 'published' ? 'Form published' : 'Form moved back to draft',
        color: nextStatus === 'published' ? 'emerald' : 'gray',
      });
    } catch {
      notifications.show({ message: 'Could not update publish status', color: 'red' });
    } finally {
      setPublishing(false);
    }
  }

  /**
   * The live form as the generator's wire shape, so a follow-up AI prompt
   * revises what is on the canvas now. Fields the generator has no concept of
   * (grids, page breaks, payment) are passed through by label/type — the
   * server keeps what it does not touch.
   */
  const aiSnapshot: CurrentFormSnapshot = {
    title,
    formDescription: description || undefined,
    submitLabel: submitLabel || undefined,
    theme: theme as unknown as Record<string, unknown>,
    fields: fields.map((f) => ({
      type: f.type,
      label: f.label,
      required: f.required,
      placeholder: f.placeholder,
      helpText: f.helpText,
      options: f.options,
      rows: f.rows,
      content: f.content,
      maxRating: f.maxRating,
      min: f.min,
      max: f.max,
    })) as GeneratedForm['fields'],
  };

  /**
   * Drop an AI revision onto the canvas. Goes through `generatedToTemplate` so
   * every field lands with the same defaults a palette drag would give it, and
   * only touches the parts the generator owns — theme, steps, notifications
   * and payments are left as the user set them. The undo history snapshots
   * this like any other edit.
   */
  function applyAiRevision(form: GeneratedForm) {
    const template = generatedToTemplate(form);
    setTitle(template.title);
    setDescription(template.formDescription ?? '');
    if (template.submitLabel !== undefined) setSubmitLabel(template.submitLabel);
    setFields(template.fields);
    if (template.theme) setTheme((prev) => ({ ...prev, ...template.theme }));
    // The revised tree may not contain whatever was selected before it.
    setSelectedId((id) => (id && findField(template.fields, id) ? id : null));
    setEditingId((id) => (id && findField(template.fields, id) ? id : null));
    notifications.show({ message: 'Applied — Ctrl+Z to undo', color: 'blue' });
  }

  function handleRailSelect(panel: RailPanel) {
    if (panel !== 'embed') {
      setRailPanel(panel);
      return;
    }
    if (isDemo) {
      notifications.show({
        message: 'Sample forms have no share link — create a form in your own workspace to embed it',
        color: 'yellow',
      });
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
      header={{ height: 52 }}
      navbar={{ width: 312, breakpoint: 'sm', collapsed: { mobile: !navOpened } }}
      aside={{ width: 56, breakpoint: 'sm' }}
      padding={0}
      classNames={{ main: classes.main }}
    >
      <AppShell.Header>
        <Group h="100%" px="sm" gap="sm" justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
            <Burger opened={navOpened} onClick={toggleNav} hiddenFrom="sm" size="sm" />
            <Tooltip label="Back to all forms" position="bottom" withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                aria-label="Back to all forms"
                onClick={() => {
                  if (isDirty) {
                    setPendingLeave(true);
                    return;
                  }
                  navigate(`/${workspaceId}/forms`);
                }}
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              fw={600}
              size="sm"
              className={classes.nameInput}
              // Grows with the name instead of holding a fixed block of header.
              style={{ width: `${Math.min(Math.max(name.length, 8) + 2, 34)}ch` }}
            />
            {/* Publish state belongs next to the name it describes, not inferred
                from which way the button in the corner is pointing. */}
            {savedForm && (
              <Badge
                variant={savedForm.status === 'published' ? 'filled' : 'light'}
                color={savedForm.status === 'published' ? 'emerald' : 'gray'}
                radius="sm"
                size="sm"
                visibleFrom="sm"
                className={classes.statusBadge}
                leftSection={
                  savedForm.status === 'published' ? (
                    <span className={classes.liveDot} />
                  ) : undefined
                }
              >
                {savedForm.status === 'published' ? 'Live' : 'Draft'}
              </Badge>
            )}
            {isDirty && (
              <Text size="xs" c="dimmed" visibleFrom="sm">
                Unsaved
              </Text>
            )}
          </Group>
          <Group gap={6} wrap="nowrap">
            {/* History and preview are inspection tools; save and publish change
                the form. The divider keeps a mis-aimed click from crossing that
                line. */}
            <Group gap={2} wrap="nowrap" className={classes.historyGroup}>
              <Tooltip label="Undo (Ctrl+Z)" position="bottom" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="md"
                  aria-label="Undo"
                  disabled={!canUndo}
                  onClick={undo}
                >
                  <IconArrowBackUp size={17} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Redo (Ctrl+Y)" position="bottom" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="md"
                  aria-label="Redo"
                  disabled={!canRedo}
                  onClick={redo}
                >
                  <IconArrowForwardUp size={17} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Tooltip label="Preview" position="bottom" withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                aria-label="Preview"
                onClick={() => setPreviewOpen(true)}
              >
                <IconEye size={18} />
              </ActionIcon>
            </Tooltip>
            <Divider orientation="vertical" my={14} />
            {isDemo ? (
              // Nothing here can be saved, so the editor says so once instead
              // of offering two buttons that would both be refused.
              <Badge color="gray" variant="light" radius="sm" size="lg">
                Demo — changes are not saved
              </Badge>
            ) : (
            <>
            {/* Colours are pinned rather than left to the theme: this editor
                runs inside the Quantalog shell, whose palette rendered both of
                these as near-invisible text. Save is the primary action, so it
                is the filled green one; publish/unpublish is outlined so the
                two read as a pair without competing. */}
            <Button
              variant="filled"
              radius="md"
              size="sm"
              className={classes.saveBtn}
              onClick={handleSave}
              loading={saving}
              disabled={!isDirty || publishing}
            >
              Save
            </Button>
            <Button
              variant="outline"
              radius="md"
              size="sm"
              className={classes.publishBtn}
              leftSection={
                savedForm?.status === 'published' ? (
                  <IconEyeOff size={16} />
                ) : (
                  <IconWorld size={16} />
                )
              }
              onClick={handleTogglePublish}
              loading={publishing}
              disabled={saving}
            >
              {savedForm?.status === 'published' ? 'Unpublish' : 'Publish'}
            </Button>
            </>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <FieldPalette
          onAdd={(type, columns) => {
            addField(type, columns);
            closeNav();
          }}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        {loadingForm ? (
          <Stack gap="md" maw={640} mx="auto" py="xl" px="md">
            <Skeleton height={32} width="50%" />
            <Skeleton height={16} width="70%" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={70} radius="md" />
            ))}
          </Stack>
        ) : (
          <FormCanvas
            title={title}
            description={description}
            fields={fields}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDeselect={() => setSelectedId(null)}
            onRemove={removeField}
            onDuplicate={duplicateField}
            onOpenProperties={setEditingId}
            onOpenFormSettings={() => setFormSettingsOpen(true)}
            hideHeader={hideHeader}
            headerAlign={headerAlign}
            onHideHeader={() => setHideHeader(true)}
            offsetRight={!!editingId || railPanel === 'ai'}
            theme={theme}
          />
        )}
      </AppShell.Main>

      <PropertiesDrawer
        field={editingField}
        allFields={fields}
        onClose={() => setEditingId(null)}
        onChange={updateField}
        paymentSettings={paymentSettings}
        onOpenPaymentSettings={() => {
          setEditingId(null);
          setRailPanel('payments');
        }}
      />

      <FormSettings
        opened={formSettingsOpen}
        onClose={() => setFormSettingsOpen(false)}
        title={title}
        description={description}
        hideHeader={hideHeader}
        headerAlign={headerAlign}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onHideHeaderChange={setHideHeader}
        onHeaderAlignChange={setHeaderAlign}
      />

      <AppShell.Aside>
        <IconRail active={railPanel} onSelect={handleRailSelect} />
      </AppShell.Aside>

      <AiEditDrawer
        opened={railPanel === 'ai'}
        onClose={() => setRailPanel(null)}
        workspaceId={workspaceId}
        snapshot={aiSnapshot}
        onApply={applyAiRevision}
        disabled={isDemo}
      />

      <QuickSettingsDrawer
        opened={railPanel === 'quickSettings'}
        onClose={() => setRailPanel(null)}
        settings={{
          hideHeader,
          labelPlacement,
          submitLabel,
          submitButtonSize,
          submitButtonWidth,
          submitButtonAlign,
          collectIp,
          requireCaptcha,
          collectPartials,
          allowEdit,
          schedule,
        }}
        onChange={(patch) => {
          if (patch.hideHeader !== undefined) setHideHeader(patch.hideHeader);
          if (patch.labelPlacement) setLabelPlacement(patch.labelPlacement);
          if (patch.submitLabel !== undefined) setSubmitLabel(patch.submitLabel);
          if (patch.submitButtonSize) setSubmitButtonSize(patch.submitButtonSize);
          if (patch.submitButtonWidth) setSubmitButtonWidth(patch.submitButtonWidth);
          if (patch.submitButtonAlign) setSubmitButtonAlign(patch.submitButtonAlign);
          if (patch.collectIp !== undefined) setCollectIp(patch.collectIp);
          if (patch.requireCaptcha !== undefined) setRequireCaptcha(patch.requireCaptcha);
          if (patch.collectPartials !== undefined) setCollectPartials(patch.collectPartials);
          if (patch.allowEdit !== undefined) setAllowEdit(patch.allowEdit);
          // Not guarded on `undefined`: clearing every date is a real edit, and
          // the drawer sends the whole schedule object each time.
          if ('schedule' in patch) setSchedule(patch.schedule);
        }}
      />

      <ThemeDrawer
        opened={railPanel === 'theme'}
        onClose={() => setRailPanel(null)}
        theme={theme}
        onChange={(patch) => setTheme((prev) => ({ ...prev, ...patch }))}
      />

      <StepsDrawer
        opened={railPanel === 'steps'}
        onClose={() => setRailPanel(null)}
        fields={fields}
        settings={{ steps, stepIndicator, showStepHeadings }}
        accent={theme.accentColor}
        onChange={(patch) => {
          if (patch.steps) setSteps(patch.steps);
          if (patch.stepIndicator) setStepIndicator(patch.stepIndicator);
          if (patch.showStepHeadings !== undefined) setShowStepHeadings(patch.showStepHeadings);
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

      <NotificationsModal
        opened={railPanel === 'notifications'}
        onClose={() => setRailPanel(null)}
        formTitle={title}
        fields={fields}
        theme={theme}
        notifications={emailNotifications}
        onChange={(patch) => setEmailNotifications((prev) => ({ ...prev, ...patch }))}
      />

      <PaymentsModal
        opened={railPanel === 'payments'}
        onClose={() => setRailPanel(null)}
        workspaceId={workspaceId}
        // One URL for the whole workspace — registered once in Razorpay,
        // covering every paid form. Available before the form is even saved.
        webhookUrl={`${
          import.meta.env.VITE_API_URL ?? `${window.location.origin}/api`
        }/public/workspaces/${workspaceId}/payments/webhook`}
      />

      <PreviewModal
        opened={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        description={description}
        fields={fields}
        hideHeader={hideHeader}
        headerAlign={headerAlign}
        labelPlacement={labelPlacement}
        submitLabel={submitLabel}
        submitButtonSize={submitButtonSize}
        submitButtonWidth={submitButtonWidth}
        submitButtonAlign={submitButtonAlign}
        theme={theme}
        steps={steps}
        stepIndicator={stepIndicator}
        showStepHeadings={showStepHeadings}
        onApplyTheme={(patch) => setTheme((prev) => ({ ...prev, ...patch }))}
      />

      {savedForm && (
        <ShareModal
          opened={shareOpen}
          onClose={() => setShareOpen(false)}
          form={savedForm}
          onStatusChange={(status) => setSavedForm({ ...savedForm, status })}
        />
      )}

      <Modal
        opened={pendingLeave}
        onClose={() => setPendingLeave(false)}
        title="Leave without saving?"
        centered
        radius="lg"
      >
        <Text size="sm">You have unsaved changes. If you leave now, they'll be lost.</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setPendingLeave(false)}>
            Stay
          </Button>
          <Button color="red" onClick={() => navigate(`/${workspaceId}/forms`)}>
            Leave without saving
          </Button>
        </Group>
      </Modal>
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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { getForm } from '@/lib/api';
import { getDemoForm } from '@/lib/demoWorkspace';
import { cloneWithNewIds, findField } from '@/lib/fieldTree';
import { useUndoHistory } from '@/hooks/useUndoHistory';
import type {
  Form,
  FormField,
  FormStep,
  StepIndicator,
  LabelPlacement,
  SubmitButtonSize,
  SubmitButtonWidth,
  SubmitButtonAlign,
  FormTheme,
  NotificationSettings,
  FormSchedule,
} from '@/types';
import type { EditableState } from './types';

const DEFAULT_THANK_YOU = 'Thanks! Your response has been recorded.';

export interface BuilderLocationState {
  title?: string;
  themeScope?: FormTheme['scope'];
  templateFields?: FormField[];
  templateDescription?: string;
  templateTheme?: FormTheme;
  templateSubmitLabel?: string;
  templateHideHeader?: boolean;
}

interface Params {
  routeFormId?: string;
  workspaceId: string;
  isDemo: boolean;
  locationState: BuilderLocationState | null;
}

 
export function useFormBuilderState({ routeFormId, workspaceId, isDemo, locationState }: Params) {
  const navigate = useNavigate();
  const initialTitle = locationState?.title ?? 'Untitled form';
 
  const [name, setName] = useState(initialTitle);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(locationState?.templateDescription ?? '');
  const [fields, setFields] = useState<FormField[]>(
    () => locationState?.templateFields?.map(cloneWithNewIds) ?? []
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [thankYouMessage, setThankYouMessage] = useState(DEFAULT_THANK_YOU);
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
  const [savedSnapshot, setSavedSnapshot] = useState('');

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
    source
      .then((form) => {
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
            thankYouMessage: form.thankYouMessage || DEFAULT_THANK_YOU,
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
      })
      .catch(() => {
        setLoadingForm(false);
        notifications.show({ message: 'Could not load this form', color: 'red' });
        navigate(`/${workspaceId}/forms`);
      });
  }, [routeFormId, workspaceId, isDemo, navigate]);

  useEffect(() => {
    if (routeFormId || locationState) return;
    setSavedSnapshot(currentSnapshot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeFormId]);

  return {
    // values
    name,
    title,
    description,
    fields,
    selectedId,
    editingId,
    thankYouMessage,
    redirectUrl,
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
    savedFormId,
    loadingForm,
    savedForm,
    currentSnapshot,
    isDirty,
    // setters
    setName,
    setTitle,
    setDescription,
    setFields,
    setSelectedId,
    setEditingId,
    setThankYouMessage,
    setRedirectUrl,
    setHideHeader,
    setHeaderAlign,
    setLabelPlacement,
    setSubmitLabel,
    setSubmitButtonSize,
    setSubmitButtonWidth,
    setSubmitButtonAlign,
    setTheme,
    setSteps,
    setStepIndicator,
    setShowStepHeadings,
    setCollectIp,
    setRequireCaptcha,
    setCollectPartials,
    setAllowEdit,
    setSchedule,
    setEmailNotifications,
    setSavedFormId,
    setSavedForm,
    setSavedSnapshot,
    // history
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

export type FormBuilderState = ReturnType<typeof useFormBuilderState>;

import { notifications } from '@mantine/notifications';
import { createForm, updateForm } from '@/lib/api';
import { findPaymentField, paymentFieldProblem, paymentStepProblem } from '@/lib/payment';
import type { PaymentSettings } from '@/types';
import type { RailPanel } from '@/components/builder/IconRail';
import type { FormBuilderState } from './useFormBuilderState';

interface Params {
  state: FormBuilderState;
  workspaceId: string;
  isDemo: boolean;
  paymentSettings: PaymentSettings | null;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setPublishing: React.Dispatch<React.SetStateAction<boolean>>;
  setShareOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setRailPanel: React.Dispatch<React.SetStateAction<RailPanel | null>>;
}

/**
 * Save and publish. Builds the write payload from the state bag, sends it, and
 * re-seeds the saved snapshot so the editor stops reporting unsaved changes.
 */
export function useFormPersistence({
  state,
  workspaceId,
  isDemo,
  paymentSettings,
  setSaving,
  setPublishing,
  setShareOpen,
  setRailPanel,
}: Params) {
  async function saveForm() {
    // Belt and braces alongside the hidden buttons: a keyboard shortcut or a
    // stale handler must not send a write the backend will refuse anyway.
    if (isDemo) throw new Error('The demo workspace is read-only');
    const payload = {
      name: state.name,
      title: state.title,
      description: state.description,
      fields: state.fields,
      redirectUrl: state.redirectUrl,
      thankYouMessage: state.thankYouMessage,
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
      collectIp: state.collectIp,
      requireCaptcha: state.requireCaptcha,
      collectPartials: state.collectPartials,
      allowEdit: state.allowEdit,
      schedule: state.schedule,
      notifications: state.emailNotifications,
    };
    const form = state.savedFormId
      ? await updateForm(state.savedFormId, payload, workspaceId)
      : await createForm(payload, workspaceId);
    state.setSavedFormId(form._id);
    state.setSavedForm(form);
    state.setSavedSnapshot(state.currentSnapshot);
    return form;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const form = await saveForm();
      notifications.show({ message: 'Form saved', color: 'emerald' });
      if (!state.savedFormId) setShareOpen(true);
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
    const payField = findPaymentField(state.fields);
    if (payField && state.savedForm?.status !== 'published') {
      const problem =
        paymentFieldProblem(payField, state.fields) ?? paymentStepProblem(state.fields);
      if (problem) {
        notifications.show({
          title: 'Fix the payment field first',
          message: problem,
          color: 'orange',
        });
        state.setSelectedId(payField.id);
        state.setEditingId(payField.id);
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
      const base = state.isDirty || !state.savedFormId ? await saveForm() : state.savedForm;
      if (!base) return;
      const nextStatus = base.status === 'published' ? 'draft' : 'published';
      const updated = await updateForm(base._id, { status: nextStatus }, workspaceId);
      state.setSavedForm(updated);
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

  return { saveForm, handleSave, handleTogglePublish };
}

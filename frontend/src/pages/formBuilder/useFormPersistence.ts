import { createForm, updateForm } from '@/lib/api';
import { findPaymentField, paymentFieldProblem, paymentStepProblem } from '@/lib/payment';
import type { PaymentSettings } from '@/types';
import type { RailPanel } from '@/components/builder/IconRail';
import type { FormBuilderState } from './useFormBuilderState';
import { notify } from '@/lib/notify';

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
      webhook: state.webhook,
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
      notify.success('Form saved');
      if (!state.savedFormId) setShareOpen(true);
      return form;
    } catch {
      notify.error('Could not save form');
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
        notify.warn(problem, 'Fix the payment field first');
        state.setSelectedId(payField.id);
        state.setEditingId(payField.id);
        return;
      }
      if (!paymentSettings?.enabled) {
        notify.warn(
          'Connect Razorpay and turn payments on, or this form cannot charge anyone.',
          'Payments are switched off',
        );
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
      if (nextStatus === 'published') notify.success('Form published');
      else notify.info('Form moved back to draft');
    } catch {
      notify.error('Could not update publish status');
    } finally {
      setPublishing(false);
    }
  }

  return { saveForm, handleSave, handleTogglePublish };
}

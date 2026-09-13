import { notifications } from '@mantine/notifications';
import { findField } from '@/lib/fieldTree';
import {
  applyEditOps,
  toEditSnapshotFields,
  type EditOp,
  type EditSnapshot,
} from '@/lib/editOps';
import type { FormTheme } from '@/types';
import type { FormBuilderState } from './useFormBuilderState';

/**
 * Editing the form on the canvas with Orbit.
 *
 * The AI answers with operations rather than with a form, and this applies them
 * to the state the builder already holds. Nothing is round-tripped: a field the
 * prompt did not mention is never serialised, never regenerated, and so never
 * quietly reworded or lost — which is what happened when an edit came back as a
 * whole form and the grids holding the layout together had no way to survive
 * the trip.
 */
export function useAiRevision(state: FormBuilderState) {
  const aiSnapshot: EditSnapshot = {
    title: state.title,
    formDescription: state.description || undefined,
    submitLabel: state.submitLabel || undefined,
    theme: state.theme as unknown as Record<string, unknown>,
    fields: toEditSnapshotFields(state.fields),
  };

  /** Applies one AI edit, and reports how much of it landed. */
  function applyAiRevision(ops: EditOp[]): number {
    const result = applyEditOps(ops, state.fields);

    if (!result.applied) {
      notifications.show({
        message: 'Orbit did not find anything to change',
        color: 'yellow',
      });
      return 0;
    }

    if (result.form.title) state.setTitle(result.form.title);
    if (result.form.formDescription !== undefined) {
      state.setDescription(result.form.formDescription);
    }
    if (result.form.submitLabel !== undefined) {
      state.setSubmitLabel(result.form.submitLabel);
    }

    state.setFields(result.fields);
    if (result.theme) {
      state.setTheme((prev) => ({ ...prev, ...(result.theme as FormTheme) }));
    }

    // A selection pointing at a field an operation removed would leave the
    // properties panel open on nothing.
    state.setSelectedId((id) => (id && findField(result.fields, id) ? id : null));
    state.setEditingId((id) => (id && findField(result.fields, id) ? id : null));

    notifications.show({ message: 'Applied — Ctrl+Z to undo', color: 'blue' });
    return result.applied;
  }

  return { aiSnapshot, applyAiRevision };
}

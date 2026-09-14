import type { AppliedEdit, EditSnapshot } from '@/lib/editOps';
import { toEditSnapshotFields } from '@/lib/editOps';
import { generatedToTemplate, type GeneratedForm } from '@/lib/generatedForm';
import type { FormTheme } from '@/types';
import type { Draft } from './types';

export function toSnapshot(draft: Draft): EditSnapshot {
  return {
    title: draft.title,
    formDescription: draft.formDescription,
    submitLabel: draft.submitLabel,
    theme: draft.theme as unknown as Record<string, unknown>,
    fields: toEditSnapshotFields(draft.fields),
  };
}

export function fromGenerated(generated: GeneratedForm): Draft {
  const built = generatedToTemplate(generated);
  return {
    title: built.title,
    formDescription: built.formDescription,
    submitLabel: built.submitLabel,
    fields: built.fields,
    theme: built.theme,
  };
}

export function withEdit(previous: Draft, result: AppliedEdit): Draft {
  return {
    title: result.form.title ?? previous.title,
    formDescription:
      result.form.formDescription !== undefined
        ? result.form.formDescription
        : previous.formDescription,
    submitLabel:
      result.form.submitLabel !== undefined ? result.form.submitLabel : previous.submitLabel,
    fields: result.fields,
    theme: result.theme
      ? { ...(previous.theme ?? {}), ...(result.theme as FormTheme) }
      : previous.theme,
  };
}

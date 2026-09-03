import { notifications } from '@mantine/notifications';
import { findField } from '@/lib/fieldTree';
import { generatedToTemplate, type GeneratedForm } from '@/lib/generatedForm';
import type { CurrentFormSnapshot } from '@/components/builder/AiEditDrawer';
import type { FormBuilderState } from './useFormBuilderState';


export function useAiRevision(state: FormBuilderState) {

  const aiSnapshot: CurrentFormSnapshot = {
    title: state.title,
    formDescription: state.description || undefined,
    submitLabel: state.submitLabel || undefined,
    theme: state.theme as unknown as Record<string, unknown>,
    fields: state.fields.map((f) => ({
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


  function applyAiRevision(form: GeneratedForm) {
    const template = generatedToTemplate(form);
    state.setTitle(template.title);
    state.setDescription(template.formDescription ?? '');
    if (template.submitLabel !== undefined) state.setSubmitLabel(template.submitLabel);
    state.setFields(template.fields);
    if (template.theme) state.setTheme((prev) => ({ ...prev, ...template.theme }));
    state.setSelectedId((id) => (id && findField(template.fields, id) ? id : null));
    state.setEditingId((id) => (id && findField(template.fields, id) ? id : null));
    notifications.show({ message: 'Applied — Ctrl+Z to undo', color: 'blue' });
  }

  return { aiSnapshot, applyAiRevision };
}

import { makeField, repeaterSubTypes } from '@/lib/fieldPalette';
import type { FormField, FieldType, FormTheme } from '@/types';
import type { FormTemplate } from '@/lib/templates/types';

function buildField(raw: GeneratedField, carry?: FormField): FormField | null {
  const type = raw.type as FieldType;
  let base: FormField;
  try {
    base = makeField(type);
  } catch {
    return null;
  }

  const field: FormField = {
    ...base,
    ...(carry ? { id: carry.id } : {}),
    label: raw.label || base.label,
    required: raw.required === true,
  };

  if (raw.placeholder) field.placeholder = raw.placeholder;
  if (raw.helpText) field.helpText = raw.helpText;
  if (raw.content) field.content = raw.content;
  if (raw.options?.length) field.options = raw.options;
  if (raw.rows?.length) field.rows = raw.rows;
  if (typeof raw.maxRating === 'number') field.maxRating = raw.maxRating;
  if (typeof raw.min === 'number') field.min = raw.min;
  if (typeof raw.max === 'number') field.max = raw.max;

  if (type === 'repeater') {
    const rawSubs = (raw.subFields ?? []).filter((s) => repeaterSubTypes.includes(s.type as FieldType));
    const prevSubs = carry?.subFields ?? [];
    const built = rawSubs
      .map((s, i) => buildField(s, prevSubs[i]?.type === (s.type as FieldType) ? prevSubs[i] : undefined))
      .filter((f): f is FormField => f !== null);
    field.subFields = built.length > 0 ? built : base.subFields;
    if (typeof raw.minRows === 'number') field.minRows = raw.minRows;
    if (typeof raw.maxRows === 'number') field.maxRows = raw.maxRows;
  }

  return field;
}

/**
 * A generated form, as it arrives from the API.
 *
 * Deliberately loose: this is the wire shape, and the point of the conversion
 * below is that nothing downstream has to treat it as anything but a template.
 */
export interface GeneratedField {
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  rows?: string[];
  content?: string;
  maxRating?: number;
  min?: number;
  max?: number;
  subFields?: GeneratedField[];
  minRows?: number;
  maxRows?: number;
}

export interface GeneratedForm {
  title: string;
  formDescription?: string;
  submitLabel?: string;
  fields: GeneratedField[];
  theme?: Record<string, unknown>;
}

 
export function generatedToTemplate(
  generated: GeneratedForm,
  prev: FormField[] = []
): FormTemplate {
  const fields: FormField[] = [];
  const claimed = new Set<string>();

  generated.fields.forEach((raw, i) => {
    const type = raw.type as FieldType;
    const carry =
      prev[i] && prev[i].type === type && !claimed.has(prev[i].id)
        ? prev[i]
        : prev.find(
            (p) => p.type === type && p.label === raw.label && !claimed.has(p.id)
          );
    const field = buildField(raw, carry);
    if (!field) return;
    if (carry) claimed.add(carry.id);
    fields.push(field);
  });

  return {
    id: 'ai-generated',
    name: generated.title,
    description: generated.formDescription ?? 'Generated from your description.',
    category: 'Basics',
    title: generated.title,
    formDescription: generated.formDescription,
    submitLabel: generated.submitLabel,
    fields,
    theme: generated.theme as FormTheme | undefined,
  };
}

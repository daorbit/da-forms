import { makeField } from '@/lib/fieldPalette';
import type { FormField, FieldType, FormTheme } from '@/types';
import type { FormTemplate } from '@/lib/templates/types';

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
}

export interface GeneratedForm {
  title: string;
  formDescription?: string;
  submitLabel?: string;
  fields: GeneratedField[];
  theme?: Record<string, unknown>;
}

/**
 * A generated form as a template the picker and the editor already understand.
 *
 * Built through `makeField` rather than by hand so every field arrives with the
 * same defaults a field dragged from the palette would have — an id, a size,
 * and whatever else its type needs. The generator sends what it decided; this
 * fills in everything it was never asked about.
 *
 * The server validates the field types before they get here, but this runs on
 * the client and cannot assume that held: an unknown type is dropped rather
 * than passed to `makeField`, which would throw on a palette lookup that misses.
 */
export function generatedToTemplate(generated: GeneratedForm): FormTemplate {
  const fields: FormField[] = [];

  for (const raw of generated.fields) {
    const type = raw.type as FieldType;
    let base: FormField;
    try {
      base = makeField(type);
    } catch {
      continue; // a type this build's palette does not have
    }

    const field: FormField = {
      ...base,
      label: raw.label || base.label,
      required: raw.required === true,
    };

    if (raw.placeholder) field.placeholder = raw.placeholder;
    if (raw.helpText) field.helpText = raw.helpText;
    if (raw.content) field.content = raw.content;
    // Only when the generator actually chose some: `makeField` seeds usable
    // defaults, and an empty array from the wire would replace them with a
    // control that renders nothing.
    if (raw.options?.length) field.options = raw.options;
    if (raw.rows?.length) field.rows = raw.rows;
    if (typeof raw.maxRating === 'number') field.maxRating = raw.maxRating;
    if (typeof raw.min === 'number') field.min = raw.min;
    if (typeof raw.max === 'number') field.max = raw.max;

    fields.push(field);
  }

  return {
    // Not a real template id — nothing looks this up, and the picker keys its
    // cards on it, so it only has to be distinct from the built-in ones.
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

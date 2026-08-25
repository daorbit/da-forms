import type { FormField, FormStep, FormTheme, StepIndicator } from '@/types';
import { makeField } from '@/lib/fieldPalette';

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  title: string;
  formDescription?: string;
  fields: FormField[];
  theme?: FormTheme;
  submitLabel?: string;
  hideHeader?: boolean;
  /** Names for each page, when the template ships with page breaks. */
  steps?: FormStep[];
  stepIndicator?: StepIndicator;
  showStepHeadings?: boolean;
}

export function field(type: Parameters<typeof makeField>[0], overrides: Partial<FormField> = {}): FormField {
  return { ...makeField(type), ...overrides };
}

/** A multi-column row — the layout most professional templates are built from. */
export function row(...columns: FormField[][]): FormField {
  return {
    id: crypto.randomUUID(),
    type: 'grid',
    label: '',
    required: false,
    columns,
  };
}

/** Splits the fields before it from the fields after it into separate steps. */
export function pageBreak(): FormField {
  return field('pageBreak');
}

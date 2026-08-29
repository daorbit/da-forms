import type { FormField, FormStep, FormTheme, StepIndicator } from '@/types';
import { makeField } from '@/lib/fieldPalette';

/** The groups the picker's filter bar offers, in the order they are shown. */
export const templateCategories = [
  'Basics',
  'Support',
  'Commerce',
  'Business',
  'Education',
  'Health',
  'HR',
  'Real estate',
  'Hospitality',
  'Community',
] as const;

export type TemplateCategory = (typeof templateCategories)[number];

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  /** Extra words the picker's search matches on beyond the name and description. */
  keywords?: string[];
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

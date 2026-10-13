import type { FieldType, FormField, FormTheme } from '@/types';
import type { FormTemplate } from '@/lib/templates';
import { cloneWithNewIds, valueFields } from '@/lib/fieldTree';

export type SwitchMode = 'design' | 'full';

export interface FieldMatch {
  current: FormField;
  next: FormField;
}

export interface TemplateDiff {
  kept: FieldMatch[];
  added: FormField[];
  removed: FormField[];
  fields: FormField[];
  same: boolean;
  empty: boolean;
}

const DISPLAY_ONLY = new Set<FieldType>([
  'heading',
  'description',
  'richText',
  'divider',
  'spacer',
  'pageBreak',
  'grid',
  'hidden',
  'uniqueId',
  'randomId',
  'calculated',
]);

const ONE_PER_FORM = new Set<FieldType>([
  'name',
  'email',
  'phone',
  'address',
  'website',
  'country',
  'booking',
  'payment',
  'signature',
  'terms',
]);

const normalise = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function inputs(fields: FormField[]): FormField[] {
  return valueFields(fields).filter((field) => !DISPLAY_ONLY.has(field.type));
}

function sameQuestion(a: FormField, b: FormField): boolean {
  if (a.type !== b.type) return false;
  if (ONE_PER_FORM.has(a.type)) return true;
  const x = normalise(a.label);
  const y = normalise(b.label);
  return Boolean(x && y) && (x === y || x.includes(y) || y.includes(x));
}

function reassign(fields: FormField[], ids: Map<string, string>): FormField[] {
  return fields.map((field) => {
    const id = ids.get(field.id) ?? field.id;
    if (field.type === 'grid' && field.columns) {
      return { ...field, id, columns: field.columns.map((column) => reassign(column, ids)) };
    }
    return { ...field, id };
  });
}

export function diffTemplate(current: FormField[], templateFields: FormField[]): TemplateDiff {
  const next = templateFields.map(cloneWithNewIds);
  const pool = inputs(current);
  const empty = pool.length === 0;
  const kept: FieldMatch[] = [];
  const added: FormField[] = [];
  const ids = new Map<string, string>();

  for (const field of inputs(next)) {
    const index = pool.findIndex((candidate) => sameQuestion(candidate, field));
    if (index === -1) {
      added.push(field);
      continue;
    }
    const [match] = pool.splice(index, 1);
    kept.push({ current: match, next: field });
    ids.set(field.id, match.id);
  }

  return {
    kept,
    added,
    removed: pool,
    fields: reassign(next, ids),
    same: !empty && added.length === 0 && pool.length === 0,
    empty,
  };
}

export function switchedFields(diff: TemplateDiff, keepExtra: boolean): FormField[] {
  return keepExtra ? [...diff.fields, ...diff.removed] : diff.fields;
}

export function switchedTheme(current: FormTheme, template: FormTemplate): FormTheme {
  return { ...(template.theme ?? {}), scope: current.scope ?? template.theme?.scope ?? 'page' };
}

export function fieldLabel(field: FormField): string {
  return field.label?.trim() || field.type;
}

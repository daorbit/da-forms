import type { FieldType, FormField, ShowIfOperator, ShowIfRule } from '@/types';
import { flattenFields } from '@/lib/fieldTree';
import { optionTypes, staticTypes } from '@/lib/fieldPalette';

export interface Choice {
  value: string;
  label: string;
}

const TEXT_OPERATORS: { value: ShowIfOperator; label: string }[] = [
  { value: 'equals', label: 'is' },
  { value: 'notEquals', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'notContains', label: 'does not contain' },
  { value: 'isEmpty', label: 'is empty' },
  { value: 'isNotEmpty', label: 'is not empty' },
];

const NUMBER_OPERATORS: { value: ShowIfOperator; label: string }[] = [
  { value: 'greaterThan', label: 'is greater than' },
  { value: 'greaterOrEqual', label: 'is at least' },
  { value: 'lessThan', label: 'is less than' },
  { value: 'lessOrEqual', label: 'is at most' },
];

const NUMERIC_FIELD_TYPES: FieldType[] = [
  'number',
  'decimal',
  'currency',
  'slider',
  'rating',
  'nps',
  'calculated',
];

const EXCLUDED_TYPES: FieldType[] = ['grid', 'repeater', 'payment', 'signature', 'pageBreak'];

export const VALUELESS_OPERATORS: ShowIfOperator[] = ['isEmpty', 'isNotEmpty'];

export function operatorsFor(field: FormField | undefined) {
  return field && NUMERIC_FIELD_TYPES.includes(field.type)
    ? [...TEXT_OPERATORS, ...NUMBER_OPERATORS]
    : TEXT_OPERATORS;
}

export function choicesFor(field: FormField | undefined): Choice[] | null {
  if (!field) return null;
  if (field.type === 'yesNo') {
    return [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ];
  }
  if (field.type === 'terms' || field.type === 'decisionBox') {
    return [
      { value: 'true', label: 'Checked' },
      { value: 'false', label: 'Not checked' },
    ];
  }
  if (optionTypes.includes(field.type) && field.type !== 'matrix' && field.type !== 'ranking') {
    return (field.options ?? []).filter(Boolean).map((option) => ({ value: option, label: option }));
  }
  return null;
}

export function conditionCandidates(fields: FormField[], excludeId?: string): FormField[] {
  return flattenFields(fields).filter(
    (field) =>
      field.id !== excludeId &&
      !EXCLUDED_TYPES.includes(field.type) &&
      !staticTypes.includes(field.type)
  );
}

export function newRule(fieldId: string): ShowIfRule {
  return { fieldId, operator: 'equals', value: '' };
}

export function newId(): string {
  return crypto.randomUUID();
}

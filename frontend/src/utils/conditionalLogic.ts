import type { FormField, ShowIfRule } from '../types';

function matches(rule: ShowIfRule, actual: unknown): boolean {
  const str = actual == null ? '' : String(actual).trim();
  switch (rule.operator) {
    case 'isEmpty':
      return str === '';
    case 'isNotEmpty':
      return str !== '';
    case 'equals':
      return str === (rule.value ?? '');
    case 'notEquals':
      return str !== (rule.value ?? '');
    case 'contains':
      return str.toLowerCase().includes((rule.value ?? '').toLowerCase());
    default:
      return true;
  }
}

/** Whether `field` should render, given the current answers keyed by field id. */
export function isFieldVisible(field: FormField, values: Record<string, unknown>): boolean {
  const rule = field.showIf;
  if (!rule) return true;
  return matches(rule, values[rule.fieldId]);
}

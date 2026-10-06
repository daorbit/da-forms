import type {
  Condition,
  FormField,
  OwnerRoute,
  ShowIfRule,
} from '../models/form.model.js';

type Values = Record<string, unknown>;

const MAX_PASSES = 5;

function asNumber(text: string | undefined): number | null {
  const cleaned = (text ?? '').replace(/[^0-9.+-]/g, '');
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function compareNumbers(actual: string, expected: string | undefined, test: (a: number, b: number) => boolean) {
  const a = asNumber(actual);
  const b = asNumber(expected);
  return a !== null && b !== null && test(a, b);
}

export function matchesRule(rule: ShowIfRule, actual: unknown): boolean {
  const str = actual == null ? '' : String(actual).trim();
  const expected = rule.value ?? '';
  switch (rule.operator) {
    case 'isEmpty':
      return str === '';
    case 'isNotEmpty':
      return str !== '';
    case 'equals':
      return str === expected;
    case 'notEquals':
      return str !== expected;
    case 'contains':
      return str.toLowerCase().includes(expected.toLowerCase());
    case 'notContains':
      return !str.toLowerCase().includes(expected.toLowerCase());
    case 'greaterThan':
      return compareNumbers(str, expected, (a, b) => a > b);
    case 'lessThan':
      return compareNumbers(str, expected, (a, b) => a < b);
    case 'greaterOrEqual':
      return compareNumbers(str, expected, (a, b) => a >= b);
    case 'lessOrEqual':
      return compareNumbers(str, expected, (a, b) => a <= b);
    default:
      return true;
  }
}

export function evaluateCondition(condition: Condition | undefined, values: Values): boolean {
  if (!condition) return true;
  if ('rules' in condition) {
    const rules = (condition.rules ?? []).filter((rule) => rule?.fieldId);
    if (!rules.length) return true;
    const test = (rule: ShowIfRule) => matchesRule(rule, values[rule.fieldId]);
    return condition.match === 'any' ? rules.some(test) : rules.every(test);
  }
  if (!condition.fieldId) return true;
  return matchesRule(condition, values[condition.fieldId]);
}

function walk(fields: FormField[], values: Values): Set<string> {
  const shown = new Set<string>();
  const visit = (field: FormField) => {
    if (!evaluateCondition(field.showIf, values)) return;
    shown.add(field.id);
    if (field.type === 'grid') {
      for (const column of field.columns ?? []) column.forEach(visit);
    }
  };

  let pageShown = true;
  for (const field of fields) {
    if (field.type === 'pageBreak') {
      pageShown = evaluateCondition(field.showIf, values);
      continue;
    }
    if (pageShown) visit(field);
  }
  return shown;
}

function onlyShown(values: Values, shown: Set<string>): Values {
  const next: Values = {};
  for (const [id, value] of Object.entries(values)) {
    if (shown.has(id)) next[id] = value;
  }
  return next;
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}

export function shownFieldIds(fields: FormField[], values: Values): Set<string> {
  let shown = walk(fields, values);
  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    const next = walk(fields, onlyShown(values, shown));
    if (sameSet(next, shown)) return next;
    shown = next;
  }
  return shown;
}

export function routedOwnerEmails(routes: OwnerRoute[] | undefined, values: Values): string[] {
  if (!Array.isArray(routes)) return [];
  return routes
    .filter((route) => route?.when?.rules?.length && evaluateCondition(route.when, values))
    .flatMap((route) => route.emails ?? []);
}

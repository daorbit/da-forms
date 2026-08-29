import type { FormField } from '@/types';

/**
 * What a respondent is told when an answer cannot be accepted, keyed by field id.
 *
 * Empty means the page is clear. A field missing from the map is valid; the
 * renderer only ever paints a message it finds here, so a rule that does not
 * fire costs nothing.
 */
export type FieldErrors = Record<string, string>;

// Deliberately loose. A form is not the place to adjudicate whether an address
// is deliverable — this catches a typo ("ada@example" , "ada.example.com") and
// lets everything else through rather than rejecting a valid rare address.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_LIKE = /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i;

/** Digits, with the separators people actually type between them. */
const PHONE = /^\+?[\d\s().-]{6,}$/;

/** The message for one field, or '' when the answer is acceptable. */
export function validateField(field: FormField, raw: string): string {
  const value = (raw ?? '').trim();

  // A consent box stores 'true'/'false' rather than filled/empty, so an
  // unticked one is "false" — non-empty, and still not an answer.
  const isConsent = field.type === 'terms' || field.type === 'decisionBox';
  if (field.required && isConsent && value !== 'true') {
    return 'Please tick this to continue.';
  }

  // A payment field carries no answer to fill in (except pay-what-you-want,
  // which renders a real NumberInput and is validated by the rules below).
  // Whether payment is required is enforced by the checkout flow at submit,
  // not by an empty-value check here — otherwise a required payment field
  // could never be submitted.
  const isPaymentSummary = field.type === 'payment' && field.pay?.mode !== 'modifiable';

  if (field.required && !value && !isPaymentSummary) {
    if (field.type === 'signature') return 'Please sign in the box.';
    return `${field.label || 'This field'} is required.`;
  }

  // A matrix is answered row by row, so "filled in" means every statement has
  // a choice — a half-completed grid is not a usable answer.
  if (field.type === 'matrix' && field.required) {
    const answered = new Set(
      value
        .split(' | ')
        .map((pair) => pair.split(': ')[0])
        .filter(Boolean)
    );
    const missing = (field.rows ?? []).filter((row) => !answered.has(row));
    if (missing.length > 0) {
      return missing.length === 1
        ? `Answer "${missing[0]}".`
        : `Answer all ${field.rows?.length} rows.`;
    }
  }

  // Every rule below describes the shape of an answer, so an empty optional
  // field has nothing to check.
  if (!value) return '';

  switch (field.type) {
    case 'email':
      if (!EMAIL.test(value)) return 'Enter an email address, like ada@example.com.';
      break;
    case 'website':
      if (!URL_LIKE.test(value)) return 'Enter a web address, like example.com.';
      break;
    case 'phone':
      if (!PHONE.test(value)) return 'Enter a phone number.';
      break;
    case 'number':
    case 'decimal':
    case 'currency': {
      const n = Number(value.replace(/[^0-9.-]/g, ''));
      if (Number.isNaN(n)) return 'Enter a number.';
      if (field.min !== undefined && n < field.min) return `Enter ${field.min} or more.`;
      if (field.max !== undefined && n > field.max) return `Enter ${field.max} or less.`;
      break;
    }
    case 'numberRange': {
      const [from, to] = value.split(' - ').map((part) => Number(part.trim()));
      if (Number.isNaN(from) || Number.isNaN(to)) return 'Enter both a start and an end.';
      if (to < from) return 'The end must not be lower than the start.';
      if (field.min !== undefined && from < field.min) return `Start at ${field.min} or more.`;
      if (field.max !== undefined && to > field.max) return `End at ${field.max} or less.`;
      break;
    }
    case 'ranking':
      // The order is always complete — the input seeds it from the options —
      // so there is nothing a respondent can get wrong here.
      break;
    case 'regex':
      if (field.pattern) {
        try {
          if (!new RegExp(field.pattern).test(value)) {
            return field.helpText || 'That is not in the expected format.';
          }
        } catch {
          // An unparseable pattern is the form author's bug, not the
          // respondent's — never block a submission over it.
        }
      }
      break;
  }

  if (field.maxLength && value.length > field.maxLength) {
    return `Keep this to ${field.maxLength} characters or fewer.`;
  }

  return '';
}

/** Every error across a set of fields — used per page, and again for the whole form. */
export function validateFields(
  fields: FormField[],
  values: Record<string, string>,
  isVisible: (field: FormField) => boolean
): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of fields) {
    if (!isVisible(field)) continue;
    const message = validateField(field, values[field.id] ?? '');
    if (message) errors[field.id] = message;
  }
  return errors;
}

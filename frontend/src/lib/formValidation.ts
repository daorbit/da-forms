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

  if (field.required && !value) {
    return `${field.label || 'This field'} is required.`;
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

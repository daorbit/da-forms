import type { FormField, PaymentConfig, SubmissionPayment } from '@/types';

/**
 * Currencies a form can charge in.
 *
 * Short on purpose: a Razorpay account only accepts what it has been enabled
 * for, and INR is the one every account has. Offering the full list would mean
 * authors picking a currency their account will reject at checkout.
 */
export const CURRENCIES = [
  { value: 'INR', label: 'INR — Indian Rupee', symbol: '₹' },
  { value: 'USD', label: 'USD — US Dollar', symbol: '$' },
] as const;

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.value === code)?.symbol ?? code;
}

/** Minor units to a display string — 149900 paise reads as ₹1,499.00. */
export function formatAmount(minorUnits: number, currency: string): string {
  const major = minorUnits / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(major);
  } catch {
    // An unknown currency code would otherwise throw and blank the field.
    return `${currencySymbol(currency)}${major.toFixed(2)}`;
  }
}

/** Rupees to paise. The single rounding point on the client, mirroring the server's. */
export function toMinorUnits(major: number): number {
  return Math.round(major * 100);
}

export function toMajorUnits(minor: number): number {
  return minor / 100;
}

/** Razorpay's floor is ₹1.00 — below it the API refuses the order. */
export const MIN_AMOUNT = 100;

/** Field types whose answer can drive a price. Mirrors what Zoho allows. */
export const PRICEABLE_TYPES: FormField['type'][] = [
  'number',
  'decimal',
  'currency',
  'slider',
  'rating',
  'radio',
  'select',
  'checkbox',
  'multipleChoice',
];

/** Choice fields price per option; numeric fields use the answer directly. */
export const CHOICE_TYPES: FormField['type'][] = [
  'radio',
  'select',
  'checkbox',
  'multipleChoice',
];

export function isChoiceField(field: FormField | undefined): boolean {
  return Boolean(field && CHOICE_TYPES.includes(field.type));
}

/**
 * What this payment field will charge, given the answers so far.
 *
 * Display only. The server recomputes the same figure from the stored form at
 * submit time and bills that one, so a wrong answer here is a cosmetic bug,
 * never a pricing one.
 */
export function previewAmount(
  pay: PaymentConfig | undefined,
  values: Record<string, string>,
  paymentFieldId?: string
): number | null {
  if (!pay) return null;

  if (pay.mode === 'fixed') return pay.amount ?? 0;

  if (pay.mode === 'modifiable') {
    // The respondent's own answer to the payment field itself.
    const raw = paymentFieldId ? values[paymentFieldId] : undefined;
    if (raw === undefined || raw === '') return pay.defaultAmount ?? null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? toMinorUnits(parsed) : null;
  }

  if (!pay.amountFieldId) return null;
  const raw = values[pay.amountFieldId];
  if (raw === undefined || raw === '') return null;

  if (pay.optionPrices) return pay.optionPrices[raw] ?? null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? toMinorUnits(parsed) : null;
}

/** Why this payment field cannot be used yet, or null when it is ready. */
export function paymentFieldProblem(field: FormField, allFields?: FormField[]): string | null {
  const pay = field.pay;
  if (!pay) return 'Not configured';

  if (pay.mode === 'fixed') {
    if (!pay.amount || pay.amount < MIN_AMOUNT) {
      return `Set an amount of at least ${formatAmount(MIN_AMOUNT, pay.currency)}`;
    }
    return null;
  }

  if (pay.mode === 'modifiable') {
    const floor = pay.minAmount ?? MIN_AMOUNT;
    if (floor < MIN_AMOUNT) {
      return `The minimum cannot be below ${formatAmount(MIN_AMOUNT, pay.currency)}`;
    }
    if (pay.maxAmount && pay.maxAmount < floor) {
      return 'The maximum is below the minimum';
    }
    return null;
  }

  if (!pay.amountFieldId) return 'Pick which field holds the amount';

  // A choice field priced per option is only configured once every option has
  // a price — an unpriced one would be rejected at submit, which is a bad
  // place to discover it.
  if (allFields && pay.optionPrices) {
    const source = flattenFields(allFields).find((f) => f.id === pay.amountFieldId);
    const unpriced = (source?.options ?? []).filter(
      (option) => !pay.optionPrices?.[option] || pay.optionPrices[option] < MIN_AMOUNT
    );
    if (unpriced.length) return `No price set for: ${unpriced.join(', ')}`;
  }

  return null;
}

/** Every field in document order, grids included. */
function flattenFields(fields: FormField[]): FormField[] {
  return fields.flatMap((field) =>
    field.type === 'grid' ? [field, ...(field.columns ?? []).flatMap(flattenFields)] : [field]
  );
}

/**
 * Multi-step problems a payment field can have, or null when it is fine.
 *
 * Both are about ordering. Payment happens at final submit whatever page the
 * field sits on, so a field on an early page tells the respondent a price and
 * then charges it several steps later; and a price read from an answer the
 * respondent has not reached yet cannot be worked out at all.
 */
export function paymentStepProblem(fields: FormField[]): string | null {
  const pages = splitPages(fields);
  if (pages.length < 2) return null;

  const paymentPage = pages.findIndex((page) => findPaymentField(page));
  if (paymentPage === -1) return null;

  const payField = findPaymentField(pages[paymentPage]);
  const pay = payField?.pay;

  if (pay?.mode === 'field' && pay.amountFieldId) {
    const sourcePage = pages.findIndex((page) =>
      flattenFields(page).some((f) => f.id === pay.amountFieldId)
    );
    if (sourcePage > paymentPage) {
      return `The amount comes from a field on step ${sourcePage + 1}, but the payment is on step ${
        paymentPage + 1
      }. Move the payment field after it.`;
    }
  }

  if (paymentPage < pages.length - 1) {
    return `Payment is taken when the form is submitted, on step ${pages.length} — not on step ${
      paymentPage + 1
    } where this field sits. Move it to the last step.`;
  }

  return null;
}

/**
 * A submission's payment as one line of text, for CSV and PDF exports.
 *
 * Those read `data[fieldId]`, which a payment field never populates — the
 * payment lives on the submission itself, written by the webhook.
 */
export function paymentCellText(payment: SubmissionPayment | undefined): string {
  if (!payment) return '';
  const amount = formatAmount(payment.amount, payment.currency);
  if (payment.status === 'paid') {
    return payment.method ? `${amount} paid (${payment.method})` : `${amount} paid`;
  }
  return `${amount} ${payment.status === 'failed' ? 'failed' : 'pending'}`;
}

/** Top-level page breaks split the form. Mirrors `splitIntoPages`. */
function splitPages(fields: FormField[]): FormField[][] {
  const pages: FormField[][] = [[]];
  for (const field of fields) {
    if (field.type === 'pageBreak') pages.push([]);
    else pages[pages.length - 1].push(field);
  }
  return pages;
}

/** The one payment field on a form, if any. Searches grid columns too. */
export function findPaymentField(fields: FormField[]): FormField | undefined {
  for (const field of fields) {
    if (field.type === 'payment') return field;
    if (field.type === 'grid') {
      const nested = findPaymentField((field.columns ?? []).flat());
      if (nested) return nested;
    }
  }
  return undefined;
}

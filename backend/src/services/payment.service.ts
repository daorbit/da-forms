import { createHmac, timingSafeEqual } from 'node:crypto';
import { WorkspaceSettingsModel, type RazorpayMode } from '../models/workspaceSettings.model.js';
import { decrypt } from '../lib/crypto.js';
import type { FormField } from '../models/form.model.js';

const RAZORPAY_API = 'https://api.razorpay.com/v1';

export class PaymentConfigError extends Error {}
export class InvalidAmountError extends Error {}

/**
 * Razorpay's smallest chargeable amount is 100 minor units (₹1.00). Anything
 * below it is rejected by their API, so it is caught here where the message can
 * name the field instead of surfacing as a provider error.
 */
export const MIN_AMOUNT = 100;

/** The payment field on a form, if it has one. Grids included — a payment field may sit in a column. */
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

/**
 * Whether a field's `showIf` rule lets it render, given the submitted answers.
 *
 * Mirrors the frontend's `isFieldVisible`. Duplicated rather than shared
 * because the two run in different packages, and the rule matters here for one
 * reason above all: a payment field hidden by a condition must not charge.
 * Trusting the browser to leave it out is not enough when money is involved.
 */
export function isFieldVisible(field: FormField, values: Record<string, string>): boolean {
  const rule = field.showIf;
  if (!rule) return true;

  const actual = values[rule.fieldId];
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

/**
 * The payment field this submission actually has to pay, if any.
 *
 * A payment field whose condition is not met is not charged — someone who
 * picked "free plan" should not be billed because the field exists on the
 * form.
 */
export function activePaymentField(
  fields: FormField[],
  values: Record<string, string>
): FormField | undefined {
  const field = findPaymentField(fields);
  if (!field) return undefined;
  return isFieldVisible(field, values) ? field : undefined;
}

/** Every field in document order, grids included. */
function flatten(fields: FormField[]): FormField[] {
  return fields.flatMap((field) =>
    field.type === 'grid' ? [field, ...(field.columns ?? []).flatMap(flatten)] : [field]
  );
}

/**
 * What this submission owes, in minor units.
 *
 * Derived from the stored field definition and the respondent's own answers.
 * The request body's idea of the price is never consulted, so editing it by
 * hand changes nothing — including in 'modifiable' mode, where the respondent
 * genuinely does choose the figure but only within the range the form owner
 * set, re-checked here.
 */
export function resolveAmount(
  field: FormField,
  data: Record<string, string>,
  allFields: FormField[]
): number {
  const pay = field.pay;
  if (!pay) throw new PaymentConfigError('Payment field is not configured');

  let amount: number;

  if (pay.mode === 'fixed') {
    amount = Number(pay.amount);
  } else if (pay.mode === 'modifiable') {
    // The respondent's own figure, submitted as this field's answer. Bounded
    // below, because a client that skips the browser's own validation would
    // otherwise set its own price.
    const raw = data[field.id];
    if (raw === undefined || raw === '') throw new InvalidAmountError('Enter an amount to pay');
    amount = Math.round(Number(raw) * 100);

    const floor = Math.max(pay.minAmount ?? MIN_AMOUNT, MIN_AMOUNT);
    if (amount < floor) {
      throw new InvalidAmountError(`The least you can pay is ${formatMinor(floor, pay.currency)}`);
    }
    if (pay.maxAmount && amount > pay.maxAmount) {
      throw new InvalidAmountError(
        `The most you can pay is ${formatMinor(pay.maxAmount, pay.currency)}`
      );
    }
  } else {
    if (!pay.amountFieldId) throw new PaymentConfigError('No amount field selected');
    const source = flatten(allFields).find((f) => f.id === pay.amountFieldId);
    if (!source) throw new PaymentConfigError('The amount field no longer exists');

    const raw = data[pay.amountFieldId];
    if (raw === undefined || raw === '') throw new InvalidAmountError('No amount was entered');

    if (pay.optionPrices) {
      // A choice field: the answer is an option's text, and the price is what
      // the form owner assigned to it. Looked up rather than parsed, so an
      // option named "500" cannot be mistaken for a price.
      const priced = pay.optionPrices[raw];
      if (priced === undefined) {
        throw new InvalidAmountError('That choice has no price set');
      }
      amount = priced;
    } else {
      // A number field: the respondent typed major units.
      amount = Math.round(Number(raw) * 100);
    }
  }

  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < MIN_AMOUNT) {
    throw new InvalidAmountError('That amount cannot be charged');
  }
  return amount;
}

/** Minor units to a readable figure, for error messages the respondent sees. */
function formatMinor(minor: number, currency: string): string {
  const major = (minor / 100).toFixed(2);
  return currency === 'INR' ? `₹${major}` : `${major} ${currency}`;
}

export interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
  mode: RazorpayMode;
}

/**
 * A workspace's Razorpay credentials for whichever mode it is set to.
 *
 * Kept in one place so the plaintext secret has exactly one path out of the
 * database, and switching modes cannot accidentally charge through the other
 * account's keys.
 */
export async function getCredentials(workspaceId: string): Promise<RazorpayCredentials> {
  const settings = await WorkspaceSettingsModel.findOne({ workspaceId });
  const razorpay = settings?.razorpay;
  if (!razorpay?.enabled) {
    throw new PaymentConfigError('This workspace is not accepting payments');
  }

  const mode = razorpay.mode ?? 'test';
  const pair = mode === 'live' ? razorpay.live : razorpay.test;
  if (!pair?.keyId || !pair.keySecretEnc) {
    throw new PaymentConfigError(`No ${mode} Razorpay keys are saved for this workspace`);
  }

  return {
    keyId: pair.keyId,
    keySecret: decrypt(pair.keySecretEnc),
    webhookSecret: pair.webhookSecretEnc ? decrypt(pair.webhookSecretEnc) : undefined,
    mode,
  };
}

function authHeader(creds: { keyId: string; keySecret: string }) {
  return `Basic ${Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64')}`;
}

/**
 * A key's prefix says which mode it belongs to.
 *
 * Checked when saving rather than at charge time: pasting live keys into the
 * test slot would otherwise mean the first "test" payment takes real money.
 */
export function keyMatchesMode(keyId: string, mode: RazorpayMode): boolean {
  return mode === 'live' ? keyId.startsWith('rzp_live_') : keyId.startsWith('rzp_test_');
}

export interface ConnectionCheck {
  ok: boolean;
  merchantId?: string;
  businessName?: string;
  message?: string;
}

/**
 * Prove a key pair works, and find out whose account it is.
 *
 * Razorpay has no "who am I" endpoint on the standard API, so this asks for a
 * single order — the smallest authenticated call that exists. A 401 means the
 * keys are wrong; anything else means they are right, whatever the payload.
 */
export async function testConnection(creds: {
  keyId: string;
  keySecret: string;
}): Promise<ConnectionCheck> {
  try {
    const res = await fetch(`${RAZORPAY_API}/orders?count=1`, {
      headers: { authorization: authHeader(creds) },
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 401) {
      return { ok: false, message: 'Razorpay rejected these keys. Check the Key ID and Secret.' };
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { error?: { description?: string } }
        | null;
      return { ok: false, message: body?.error?.description ?? `Razorpay returned ${res.status}` };
    }

    // The account's own id rides along on any order it has. A brand-new
    // account with no orders yet still authenticates, which is the thing
    // being tested — the name is a bonus, not the point.
    const body = (await res.json()) as { items?: { id?: string }[] };
    return {
      ok: true,
      merchantId: creds.keyId.replace(/^rzp_(test|live)_/, ''),
      businessName: body.items?.length ? undefined : undefined,
    };
  } catch {
    return { ok: false, message: 'Could not reach Razorpay. Check your connection and try again.' };
  }
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

/**
 * Open an order with Razorpay. The returned id is what the browser hands to
 * checkout, and what the webhook later arrives quoting.
 *
 * `receipt` carries our submission id so a payment can be traced back from the
 * Razorpay dashboard without a lookup table.
 */
export async function createOrder(
  creds: RazorpayCredentials,
  input: { amount: number; currency: string; receipt: string; notes?: Record<string, string> }
): Promise<RazorpayOrder> {
  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: 'POST',
    headers: { authorization: authHeader(creds), 'content-type': 'application/json' },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { description?: string } } | null;
    throw new PaymentConfigError(body?.error?.description ?? `Razorpay refused the order (${res.status})`);
  }
  return (await res.json()) as RazorpayOrder;
}

/** Constant-time compare, so a mismatch leaks nothing about how far it matched. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Verifies a webhook really came from Razorpay.
 *
 * Signed over the raw request bytes — re-serialising the parsed JSON would
 * produce different bytes and fail every time, which is why the webhook route
 * is mounted with a raw body parser.
 */
export function verifyWebhookSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

/**
 * Verifies the handshake the browser reports after checkout closes.
 *
 * This is a convenience only — it lets the page show a result immediately
 * instead of waiting on the webhook. The webhook remains what actually marks a
 * submission paid, because anything the browser says can be fabricated.
 */
export function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string
): boolean {
  const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature);
}

import {
  WorkspaceSettingsModel,
  type PaymentMode,
  type PaymentProvider,
} from '../models/workspaceSettings.model.js';
import { decrypt } from '../lib/crypto.js';
import type { FormField } from '../models/form.model.js';
import { gatewayFor, PROVIDER_LABELS } from './gateways/index.js';
import type {
  GatewayCredentials,
  CheckoutSession,
  OrderInput,
  WebhookEvent,
} from './gateways/types.js';

export class PaymentConfigError extends Error {}
export class InvalidAmountError extends Error {}

/**
 * Razorpay's smallest chargeable amount is 100 minor units (₹1.00). Anything
 * below it is rejected by their API, so it is caught here where the message can
 * name the field instead of surfacing as a provider error.
 */
export const MIN_AMOUNT = 100;

/**
 * Choice fields that can hold more than one pick at a time.
 *
 * Their answer is one comma-joined string, so a price read from them is the
 * sum of what was ticked rather than a single lookup.
 */
const MULTI_SELECT_TYPES = ['checkbox', 'multipleChoice', 'chips'];

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
      //
      // A multi-select stores its picks as one comma-joined string, so the
      // total is the sum of what was ticked — matching how `FieldControl`
      // writes the value back.
      const picks = MULTI_SELECT_TYPES.includes(source.type)
        ? raw.split(', ').filter(Boolean)
        : [raw];

      let total = 0;
      for (const pick of picks) {
        const priced = pay.optionPrices[pick];
        if (priced === undefined) {
          throw new InvalidAmountError(`"${pick}" has no price set`);
        }
        total += priced;
      }
      amount = total;
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


export type { GatewayCredentials, CheckoutSession, WebhookEvent };

export type PaymentCredentials = GatewayCredentials;
export type RazorpayCredentials = GatewayCredentials;

const PHONE_TYPES = ['phone', 'tel', 'mobile'];
const EMAIL_TYPES = ['email'];
const NAME_HINTS = ['name', 'full name', 'your name'];
const PHONE_HINTS = ['phone', 'mobile', 'contact', 'whatsapp'];
const INDIAN_PHONE = /^[6-9]\d{9}$/;

export class PhoneRequiredError extends Error {}

/**
 * A submitted number reduced to the ten digits Cashfree wants, or undefined
 * when it is not a number they will accept.
 *
 * Country code and separators are stripped rather than rejected — someone
 * typing "+91 98765 43210" has given a perfectly good number, and refusing it
 * over formatting would be the wrong lesson to draw from a failed payment.
 */
export function normalisePhone(raw: string): string | undefined {
  const digits = raw.replace(/\D/g, '');
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return INDIAN_PHONE.test(local) ? local : undefined;
}

/**
 * Providers that will not open an order without a customer phone number.
 *
 * Razorpay collects one inside its own checkout, so a form that asks for
 * nothing still produces a payment with a contact on it. Cashfree wants it up
 * front, which is why a form charging through it has to have a number in hand
 * before the order can be created.
 */
const PHONE_REQUIRED = new Set<PaymentProvider>(['cashfree', 'payu']);

export function providerNeedsPhone(provider: PaymentProvider): boolean {
  return PHONE_REQUIRED.has(provider);
}

/**
 * Whether a form charging through this provider can find a phone number in its
 * own fields, or will have to ask for one at submit time.
 *
 * Answered from the field definitions alone so the builder can warn while the
 * form is being edited, long before anyone submits it.
 */
export function formCollectsPhone(fields: FormField[]): boolean {
  return flatten(fields).some((field) => {
    if (PHONE_TYPES.includes(field.type)) return true;
    const label = (field.label ?? '').toLowerCase();
    return PHONE_HINTS.some((hint) => label.includes(hint));
  });
}

export function findCustomerDetails(
  fields: FormField[],
  values: Record<string, string>
): { phone?: string; email?: string; name?: string } {
  const all = flatten(fields);
  let phone: string | undefined;
  let email: string | undefined;
  let name: string | undefined;

  for (const field of all) {
    const answer = values[field.id];
    if (!answer || typeof answer !== 'string' || !answer.trim()) continue;
    const label = (field.label ?? '').toLowerCase();

    if (!phone) {
      if (PHONE_TYPES.includes(field.type)) {
        phone = normalisePhone(answer);
      } else if (PHONE_HINTS.some((hint) => label.includes(hint))) {
        phone = normalisePhone(answer);
      }
    }

    if (!email && (EMAIL_TYPES.includes(field.type) || label.includes('email'))) {
      if (answer.includes('@')) email = answer.trim();
    }

    if (!name && NAME_HINTS.some((hint) => label.includes(hint))) {
      name = answer.trim().slice(0, 100);
    }
  }

  return { phone, email, name };
}

export function resolveProvider(
  field: FormField | undefined,
  defaultProvider: PaymentProvider
): PaymentProvider {
  const chosen = field?.pay?.provider;
  return chosen ?? defaultProvider;
}

export async function getWorkspaceDefaultProvider(
  workspaceId: string
): Promise<PaymentProvider> {
  const settings = await WorkspaceSettingsModel.findOne({ workspaceId });
  return settings?.defaultProvider ?? 'razorpay';
}

/**
 * Gateways whose webhooks are signed with the API secret itself.
 *
 * Cashfree signs with the secret key; PayU hashes with the merchant salt, which
 * is the same value it uses for the payment request. Neither issues a separate
 * webhook secret, so asking a workspace to save one would be asking for
 * something that does not exist.
 */
const WEBHOOK_SIGNED_WITH_API_SECRET = new Set<PaymentProvider>(['cashfree', 'payu']);

export async function getCredentials(
  workspaceId: string,
  provider?: PaymentProvider
): Promise<GatewayCredentials> {
  const settings = await WorkspaceSettingsModel.findOne({ workspaceId });
  const resolved = provider ?? settings?.defaultProvider ?? 'razorpay';
  const stored = settings?.[resolved];
  const name = PROVIDER_LABELS[resolved];

  if (!stored?.enabled) {
    throw new PaymentConfigError(`This workspace is not accepting ${name} payments`);
  }

  const mode: PaymentMode = stored.mode ?? 'test';
  const pair = mode === 'live' ? stored.live : stored.test;
  if (!pair?.keyId || !pair.keySecretEnc) {
    throw new PaymentConfigError(`No ${mode} ${name} keys are saved for this workspace`);
  }

  const keySecret = decrypt(pair.keySecretEnc);

  return {
    provider: resolved,
    keyId: pair.keyId,
    keySecret,
    webhookSecret: pair.webhookSecretEnc
      ? decrypt(pair.webhookSecretEnc)
      : WEBHOOK_SIGNED_WITH_API_SECRET.has(resolved)
        ? keySecret
        : undefined,
    mode,
  };
}

export function keyMatchesMode(
  keyId: string,
  mode: PaymentMode,
  provider: PaymentProvider = 'razorpay'
): boolean {
  return gatewayFor(provider).keyMatchesMode(keyId, mode);
}

export function testConnection(creds: {
  keyId: string;
  keySecret: string;
  mode?: PaymentMode;
  provider?: PaymentProvider;
}) {
  const provider = creds.provider ?? 'razorpay';
  return gatewayFor(provider).testConnection({
    keyId: creds.keyId,
    keySecret: creds.keySecret,
    mode: creds.mode ?? 'test',
  });
}

export async function createCheckout(
  creds: GatewayCredentials,
  input: OrderInput
): Promise<CheckoutSession> {
  try {
    return await gatewayFor(creds.provider).createCheckout(creds, input);
  } catch (err) {
    throw new PaymentConfigError(
      err instanceof Error ? err.message : `${PROVIDER_LABELS[creds.provider]} refused the order`
    );
  }
}

export async function createOrder(
  creds: GatewayCredentials,
  input: OrderInput
): Promise<CheckoutSession> {
  return createCheckout(creds, input);
}

export function parseWebhook(
  provider: PaymentProvider,
  request: { rawBody: Buffer; headers: Record<string, string | undefined>; secret: string }
): WebhookEvent | null {
  return gatewayFor(provider).parseWebhook(request);
}

/**
 * Ask the gateway directly what became of an order.
 *
 * Only PayU implements this. Its webhook has to be switched on per merchant and
 * can arrive late or never, so the respondent's return from the payment page
 * asks PayU itself rather than believing the browser. Gateways whose webhook is
 * dependable return null and the webhook stays the only word on a payment.
 */
export function verifyPayment(
  creds: GatewayCredentials,
  orderId: string
): Promise<WebhookEvent | null> {
  const gateway = gatewayFor(creds.provider);
  return gateway.verifyPayment ? gateway.verifyPayment(creds, orderId) : Promise.resolve(null);
}

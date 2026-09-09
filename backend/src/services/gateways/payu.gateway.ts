import { createHash, timingSafeEqual, randomUUID } from 'node:crypto';
import type {
  PaymentGateway,
  GatewayCredentials,
  CheckoutSession,
  OrderInput,
  ConnectionCheck,
  WebhookEvent,
  WebhookRequest,
  PaymentMode,
} from './types.js';

 
const CHECKOUT_HOST: Record<PaymentMode, string> = {
  test: 'https://test.payu.in',
  live: 'https://secure.payu.in',
};

/** The server-to-server API behind `verify_payment` and friends. */
const INFO_HOST: Record<PaymentMode, string> = {
  test: 'https://test.payu.in',
  live: 'https://info.payu.in',
};

 
function newTxnId(): string {
  return `daf${randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

/** PayU prices in major units with two decimals — "1499.00", not paise. */
function toMajor(minor: number): string {
  return (minor / 100).toFixed(2);
}

function sha512(input: string): string {
  return createHash('sha512').update(input).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a.toLowerCase());
  const bufB = Buffer.from(b.toLowerCase());
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
 
export function requestHash(
  params: {
    key: string;
    txnid: string;
    amount: string;
    productinfo: string;
    firstname: string;
    email: string;
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
  },
  salt: string
): string {
  const parts = [
    params.key,
    params.txnid,
    params.amount,
    params.productinfo,
    params.firstname,
    params.email,
    params.udf1 ?? '',
    params.udf2 ?? '',
    params.udf3 ?? '',
    params.udf4 ?? '',
    params.udf5 ?? '',
    '',
    '',
    '',
    '',
    '',
    salt,
  ];
  return sha512(parts.join('|'));
}

 
export function responseHash(
  params: Record<string, string | undefined>,
  salt: string
): string {
  const parts = [
    salt,
    params.status ?? '',
    '',
    '',
    '',
    '',
    '',
    params.udf5 ?? '',
    params.udf4 ?? '',
    params.udf3 ?? '',
    params.udf2 ?? '',
    params.udf1 ?? '',
    params.email ?? '',
    params.firstname ?? '',
    params.productinfo ?? '',
    params.amount ?? '',
    params.txnid ?? '',
    params.key ?? '',
  ];
  const base = parts.join('|');
  return sha512(params.additionalCharges ? `${params.additionalCharges}|${base}` : base);
}

 
export function verifyResponseHash(
  params: Record<string, string | undefined>,
  salt: string
): boolean {
  const given = params.hash;
  if (!given) return false;
  return safeEqual(responseHash(params, salt), given);
}

/** PayU's own words for what happened, reduced to what a submission cares about. */
function kindOf(status: string | undefined): WebhookEvent['kind'] {
  const value = (status ?? '').toLowerCase();
  if (value === 'success') return 'paid';
  if (value === 'failure' || value === 'failed' || value === 'usercancelled') return 'failed';
 
  return 'ignored';
}

 
function toEvent(params: Record<string, string | undefined>): WebhookEvent {
  const kind = kindOf(params.status);
  const common = {
    orderId: params.txnid,
    paymentId: params.mihpayid,
    payerEmail: params.email,
    payerContact: params.phone,
    method: params.mode,
  };
  return kind === 'ignored'
    ? { kind, reason: params.status ?? 'unknown status', ...common }
    : { kind, ...common };
}

/** A form-encoded body as a plain object. PayU posts both its return and its webhook this way. */
function parseFormBody(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(raw)) out[key] = value;
  return out;
}

interface PayuVerifyResponse {
  status?: number | string;
  msg?: string;
  transaction_details?: Record<
    string,
    {
      status?: string;
      mihpayid?: string;
      mode?: string;
      email?: string;
      phone?: string;
      amt?: string | number;
      error_code?: string;
    }
  >;
}

 
async function command(
  creds: GatewayCredentials,
  name: string,
  var1: string
): Promise<PayuVerifyResponse | null> {
  const body = new URLSearchParams({
    key: creds.keyId,
    command: name,
    var1,
    hash: sha512(`${creds.keyId}|${name}|${var1}|${creds.keySecret}`),
  });

  const res = await fetch(`${INFO_HOST[creds.mode]}/merchant/postservice.php?form=2`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as PayuVerifyResponse | null;
}

export const payuGateway: PaymentGateway = {
  provider: 'payu',

  async createCheckout(
    creds: GatewayCredentials,
    input: OrderInput
  ): Promise<CheckoutSession> {
 
    if (input.currency !== 'INR') {
      throw new Error('PayU can only charge in INR. Switch the field to INR or use another gateway.');
    }
    if (!input.returnUrl) {
      throw new Error('PayU needs a return URL');
    }

    const txnid = newTxnId();
    const amount = toMajor(input.amount);
    // PayU rejects a blank name and treats several punctuation marks as
    // suspicious, so an unnamed respondent gets a neutral stand-in rather than
    // a refused payment.
    const firstname = (input.customerName ?? 'Customer').replace(/[^\p{L}\p{N} .'-]/gu, '').trim();
    const productinfo = (input.description ?? 'Form payment').slice(0, 100);
    const email = input.customerEmail ?? '';

    const fields: Record<string, string> = {
      key: creds.keyId,
      txnid,
      amount,
      productinfo,
      firstname: firstname || 'Customer',
      email,
      phone: input.customerPhone ?? '',
      surl: input.returnUrl,
      furl: input.returnUrl,
      udf1: input.receipt,
      udf2: input.notes?.formId ?? '',
      udf3: input.notes?.workspaceId ?? '',
    };

    fields.hash = requestHash(
      {
        key: fields.key,
        txnid,
        amount,
        productinfo,
        firstname: fields.firstname,
        email,
        udf1: fields.udf1,
        udf2: fields.udf2,
        udf3: fields.udf3,
      },
      creds.keySecret
    );

    return {
      orderId: txnid,
      amount: input.amount,
      currency: input.currency,
      keyId: creds.keyId,
      redirectUrl: `${CHECKOUT_HOST[creds.mode]}/_payment`,
      redirectFields: fields,
    };
  },

  async testConnection(creds): Promise<ConnectionCheck> {
    try {
      const body = await command(
        { ...creds, provider: 'payu', keySecret: creds.keySecret } as GatewayCredentials,
        'verify_payment',
        'da_forms_probe'
      );

      if (!body) {
        return { ok: false, message: 'PayU did not answer. Check your connection and try again.' };
      }

      const message = (body.msg ?? '').toLowerCase();
      if (message.includes('hash') || message.includes('key') || message.includes('merchant')) {
        return {
          ok: false,
          message:
            'PayU rejected these credentials. Check the Merchant Key and Salt, and that they match the selected mode.',
        };
      }

      // status 0 with a "no transaction" message is the expected answer for a
      // made-up id and means the credentials were accepted.
      return { ok: true, merchantId: creds.keyId };
    } catch {
      return { ok: false, message: 'Could not reach PayU. Check your connection and try again.' };
    }
  },

  // PayU keys carry no mode marker of their own — the same-looking key belongs
  // to a test or a production merchant account, and only the connection test
  // can tell them apart.
  keyMatchesMode(): boolean {
    return true;
  },

  parseWebhook({ rawBody, secret }: WebhookRequest): WebhookEvent | null {
    const raw = rawBody.toString('utf8');
    // PayU posts webhooks form-encoded, but merchants can be configured for
    // JSON. Both carry the same field names and the same hash.
    const params = raw.trim().startsWith('{')
      ? (JSON.parse(raw) as Record<string, string | undefined>)
      : parseFormBody(raw);

    if (!verifyResponseHash(params, secret)) return null;
    return toEvent(params);
  },

  async verifyPayment(creds, orderId): Promise<WebhookEvent | null> {
    const body = await command(creds, 'verify_payment', orderId);
    const details = body?.transaction_details?.[orderId];
    if (!details) return null;

    const kind = kindOf(details.status);
    const common = {
      orderId,
      paymentId: details.mihpayid,
      payerEmail: details.email,
      payerContact: details.phone,
      method: details.mode,
    };
    return kind === 'ignored'
      ? { kind, reason: details.status ?? 'unknown status', ...common }
      : { kind, ...common };
  },
};

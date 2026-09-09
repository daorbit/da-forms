import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
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

 
const API_HOST: Record<PaymentMode, string> = {
  test: 'https://sandbox.cashfree.com/pg',
  live: 'https://api.cashfree.com/pg',
};

 
const API_VERSION = '2025-01-01';

 
const PLACEHOLDER_PHONE = '9999999999';

function headers(creds: { keyId: string; keySecret: string }) {
  return {
    'x-api-version': API_VERSION,
    'x-client-id': creds.keyId,
    'x-client-secret': creds.keySecret,
    'content-type': 'application/json',
  };
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

 
function newOrderId(): string {
  return `daf_${randomUUID().replace(/-/g, '')}`;
}

function toMajor(minor: number): number {
  return Number((minor / 100).toFixed(2));
}

interface CashfreeOrderResponse {
  cf_order_id?: string;
  order_id?: string;
  order_status?: string;
  payment_session_id?: string;
}

interface CashfreeError {
  message?: string;
  code?: string;
  type?: string;
}

export const cashfreeGateway: PaymentGateway = {
  provider: 'cashfree',

  async createCheckout(
    creds: GatewayCredentials,
    input: OrderInput
  ): Promise<CheckoutSession> {
    const orderId = newOrderId();

    const res = await fetch(`${API_HOST[creds.mode]}/orders`, {
      method: 'POST',
      headers: headers(creds),
      body: JSON.stringify({
        order_id: orderId,
        order_amount: toMajor(input.amount),
        order_currency: input.currency,
        customer_details: {
          customer_id: `cust_${input.receipt}`,
          customer_phone: input.customerPhone || PLACEHOLDER_PHONE,
          ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
          ...(input.customerName ? { customer_name: input.customerName } : {}),
        },
        order_tags: { receipt: input.receipt, ...input.notes },
        order_note: input.notes?.formId ? `Form ${input.notes.formId}` : undefined,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as CashfreeError | null;
      throw new Error(body?.message ?? `Cashfree refused the order (${res.status})`);
    }

    const order = (await res.json()) as CashfreeOrderResponse;
    if (!order.payment_session_id) {
      throw new Error('Cashfree did not return a payment session');
    }

    return {
      orderId: order.order_id ?? orderId,
      amount: input.amount,
      currency: input.currency,
      paymentSessionId: order.payment_session_id,
    };
  },

  async testConnection(creds): Promise<ConnectionCheck> {
    try {
      const res = await fetch(`${API_HOST[creds.mode]}/orders/da_forms_probe`, {
        headers: headers(creds),
        signal: AbortSignal.timeout(10_000),
      });

      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          message:
            'Cashfree rejected these keys. Check the App ID and Secret Key, and that they match the selected mode.',
        };
      }
 
      if (res.status === 404 || res.ok) {
        return { ok: true, merchantId: creds.keyId.slice(-8) };
      }

      const body = (await res.json().catch(() => null)) as CashfreeError | null;
      return { ok: false, message: body?.message ?? `Cashfree returned ${res.status}` };
    } catch {
      return { ok: false, message: 'Could not reach Cashfree. Check your connection and try again.' };
    }
  },
 
  keyMatchesMode(): boolean {
    return true;
  },

  parseWebhook({ rawBody, headers: reqHeaders, secret }: WebhookRequest): WebhookEvent | null {
    const signature = reqHeaders['x-webhook-signature'];
    const timestamp = reqHeaders['x-webhook-timestamp'];
    if (!signature || !timestamp) return null;
 
    const expected = createHmac('sha256', secret)
      .update(timestamp + rawBody.toString('utf8'))
      .digest('base64');
    if (!safeEqual(expected, signature)) return null;

    const event = JSON.parse(rawBody.toString('utf8')) as {
      type?: string;
      data?: {
        order?: { order_id?: string };
        payment?: {
          cf_payment_id?: string | number;
          payment_status?: string;
          payment_group?: string;
          payment_method?: unknown;
        };
        customer_details?: { customer_email?: string; customer_phone?: string };
      };
    };

    const orderId = event.data?.order?.order_id;
    const paymentId =
      event.data?.payment?.cf_payment_id !== undefined
        ? String(event.data.payment.cf_payment_id)
        : undefined;

    const common = {
      orderId,
      paymentId,
      payerEmail: event.data?.customer_details?.customer_email,
      payerContact: event.data?.customer_details?.customer_phone,
      method: event.data?.payment?.payment_group,
    };

    switch (event.type) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
        return { kind: 'paid', ...common };
      case 'PAYMENT_FAILED_WEBHOOK':
      case 'PAYMENT_USER_DROPPED_WEBHOOK':
        return { kind: 'failed', ...common };
      default:
        return { kind: 'ignored', reason: event.type ?? 'unknown event' };
    }
  },
};

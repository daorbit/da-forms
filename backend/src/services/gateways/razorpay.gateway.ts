import { createHmac, timingSafeEqual } from 'node:crypto';
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

const RAZORPAY_API = 'https://api.razorpay.com/v1';

function authHeader(creds: { keyId: string; keySecret: string }) {
  return `Basic ${Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64')}`;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export const razorpayGateway: PaymentGateway = {
  provider: 'razorpay',

  async createCheckout(
    creds: GatewayCredentials,
    input: OrderInput
  ): Promise<CheckoutSession> {
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
      const body = (await res.json().catch(() => null)) as
        | { error?: { description?: string } }
        | null;
      throw new Error(body?.error?.description ?? `Razorpay refused the order (${res.status})`);
    }

    const order = (await res.json()) as { id: string; amount: number; currency: string };
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: creds.keyId,
    };
  },

  async testConnection(creds): Promise<ConnectionCheck> {
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

      await res.json().catch(() => null);
      return { ok: true, merchantId: creds.keyId.replace(/^rzp_(test|live)_/, '') };
    } catch {
      return { ok: false, message: 'Could not reach Razorpay. Check your connection and try again.' };
    }
  },

  keyMatchesMode(keyId: string, mode: PaymentMode): boolean {
    return mode === 'live' ? keyId.startsWith('rzp_live_') : keyId.startsWith('rzp_test_');
  },

  parseWebhook({ rawBody, headers, secret }: WebhookRequest): WebhookEvent | null {
    const signature = headers['x-razorpay-signature'];
    if (!signature) return null;

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    if (!safeEqual(expected, signature)) return null;

    const event = JSON.parse(rawBody.toString('utf8')) as {
      event: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            email?: string;
            contact?: string;
            method?: string;
          };
        };
      };
    };

    const entity = event.payload?.payment?.entity;
    const common = {
      orderId: entity?.order_id,
      paymentId: entity?.id,
      payerEmail: entity?.email,
      payerContact: entity?.contact,
      method: entity?.method,
    };

    if (event.event === 'payment.failed') return { kind: 'failed', ...common };
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      return { kind: 'paid', ...common };
    }
    return { kind: 'ignored', reason: event.event };
  },
};

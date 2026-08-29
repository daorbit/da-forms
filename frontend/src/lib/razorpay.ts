import type { PaymentRequired } from '@/types';

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: 'payment.failed', handler: (response: unknown) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let loader: Promise<void> | null = null;

/**
 * Load Razorpay's checkout script, once.
 *
 * Deliberately not bundled: Razorpay require checkout to be served from their
 * domain, and a vendored copy would go stale against a payment flow we do not
 * control. The promise is cached so a respondent who submits twice does not
 * add a second script tag.
 */
export function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Cleared so a later attempt can retry rather than reusing a rejected
      // promise forever — the failure is usually a blocked network, not a
      // permanent one.
      loader = null;
      reject(new Error('Could not load the payment window. Check your connection and try again.'));
    };
    document.body.appendChild(script);
  });

  return loader;
}

export interface CheckoutOutcome {
  /**
   * True when checkout reported success. It is not proof of payment — the
   * webhook is — so the caller still confirms with the server before
   * showing a thank-you.
   */
  ok: boolean;
  paymentId?: string;
  /** Set when checkout reported a failure, or the respondent closed the window. */
  reason?: string;
}

/**
 * Open Razorpay checkout and settle when the respondent is done with it.
 *
 * Resolves rather than rejects on failure or dismissal: neither is exceptional
 * — someone closing the window is an ordinary thing to do, and the caller
 * handles all three outcomes the same way.
 */
export async function openCheckout(
  payment: PaymentRequired,
  prefill: { name?: string; email?: string; contact?: string } = {}
): Promise<CheckoutOutcome> {
  await loadRazorpay();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error('Payment window is unavailable');

  return new Promise<CheckoutOutcome>((resolve) => {
    let settled = false;
    // Razorpay can fire both a failure event and the dismiss handler for one
    // abandoned payment. First outcome wins; the rest are ignored.
    const settle = (outcome: CheckoutOutcome) => {
      if (settled) return;
      settled = true;
      resolve(outcome);
    };

    const instance = new Razorpay({
      key: payment.keyId,
      order_id: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      name: payment.description,
      description: payment.description,
      prefill,
      handler: (response: RazorpayHandlerResponse) =>
        settle({ ok: true, paymentId: response.razorpay_payment_id }),
      modal: {
        ondismiss: () => settle({ ok: false, reason: 'Payment was cancelled.' }),
      },
    });

    instance.on('payment.failed', () =>
      settle({ ok: false, reason: 'The payment did not go through. Nothing was charged.' })
    );

    instance.open();
  });
}

/**
 * Wait for the webhook to mark the submission complete.
 *
 * Checkout returning success only means the respondent's bank approved it;
 * the submission is not a response until Razorpay's webhook tells the server
 * so. That usually lands within a second or two, hence the short poll.
 */
export async function waitForPayment(
  check: () => Promise<{ status: string }>,
  { attempts = 10, intervalMs = 1500 } = {}
): Promise<boolean> {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const result = await check();
      if (result.status === 'complete') return true;
    } catch {
      // A failed poll is not a failed payment — keep trying until the
      // attempts run out.
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

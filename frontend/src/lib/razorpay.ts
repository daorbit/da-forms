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
  ok: boolean;
  paymentId?: string;
  reason?: string;
}

 
const RZP_OPEN_CLASS = 'rzp-checkout-open';

 
function unlockForCheckout() {
  for (const el of [document.documentElement, document.body]) {
    for (const prop of ['overflow', 'overflow-x', 'overflow-y', 'padding-right', 'position', 'top', 'width']) {
      el.style.removeProperty(prop);
    }
    el.removeAttribute('data-mantine-scroll-locked');
  }
  document.body.classList.add(RZP_OPEN_CLASS);
}

function relockAfterCheckout() {
  document.body.classList.remove(RZP_OPEN_CLASS);
}

export async function openCheckout(
  payment: PaymentRequired,
  prefill: { name?: string; email?: string; contact?: string } = {}
): Promise<CheckoutOutcome> {
  await loadRazorpay();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error('Payment window is unavailable');

  unlockForCheckout();

  return new Promise<CheckoutOutcome>((resolve) => {
    let settled = false;
    const settle = (outcome: CheckoutOutcome) => {
      if (settled) return;
      settled = true;
      relockAfterCheckout();
      resolve(outcome);
    };

    const instance = new Razorpay({
      key: payment.keyId,
      order_id: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      name: payment.brandName || payment.description,
      description: payment.description,
      image: payment.brandLogo,
      ...(payment.brandAccent ? { theme: { color: payment.brandAccent } } : {}),
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

import type { PaymentRequired } from '@/types';
import type { CheckoutOutcome } from './razorpay';

/**
 * Where a PayU payment left off, kept across the redirect.
 *
 * PayU takes the respondent off this page entirely, so everything the page
 * knows — which order was started, and the answers behind it — is gone by the
 * time they come back. This is what survives, in session storage rather than
 * local: it belongs to this tab and this attempt, and has no business outliving
 * either.
 */
const PENDING_KEY = 'daf.payu.pending';

export interface PendingPayuPayment {
  formId: string;
  orderId: string;
  startedAt: number;
}

export function rememberPayuPayment(pending: PendingPayuPayment): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    // Private browsing, or storage turned off. The payment still works — the
    // respondent simply comes back to a form that does not know it was them,
    // and the order id in the return URL is what recovers it instead.
  }
}

export function takePayuPayment(formId: string): PendingPayuPayment | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw) as PendingPayuPayment;
    // Read once. A stale entry would otherwise make the next visit to this form
    // wait on a payment that finished hours ago.
    sessionStorage.removeItem(PENDING_KEY);
    return pending.formId === formId ? pending : null;
  } catch {
    return null;
  }
}

/**
 * Send the respondent to PayU.
 *
 * PayU's checkout is a page of their own, reached by POSTing the signed fields
 * the server built. There is no window to open and nothing to await: this
 * navigates away, and the outcome comes back through the return URL rather
 * than through this promise.
 *
 * The promise deliberately never settles. Its caller shows a spinner while it
 * is pending, which is exactly right for the moment between the click and the
 * browser leaving — resolving would flash a "payment not completed" message
 * over a page that is on its way out.
 */
export function openPayuCheckout(payment: PaymentRequired): Promise<CheckoutOutcome> {
  if (!payment.redirectUrl || !payment.redirectFields) {
    return Promise.resolve({
      ok: false,
      reason: 'This payment could not be started. Nothing was charged.',
    });
  }

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = payment.redirectUrl;
  // PayU's page renders in the top-level window; nothing here is framed.
  form.style.display = 'none';

  for (const [name, value] of Object.entries(payment.redirectFields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    // Assigned as a property rather than through an attribute string, so a
    // value containing quotes cannot break out into markup.
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();

  return new Promise<CheckoutOutcome>(() => {});
}

import type { PaymentRequired } from '@/types';
import type { CheckoutOutcome } from './razorpay';
import { loadScriptOnce, unlockForCheckout, relockAfterCheckout } from './checkoutShell';

const CHECKOUT_SRC = 'https://sdk.cashfree.com/js/v3/cashfree.js';

interface CashfreeCheckoutResult {
  error?: { message?: string };
  redirect?: boolean;
  paymentDetails?: { paymentMessage?: string };
}

interface CashfreeInstance {
  checkout(options: {
    paymentSessionId: string;
    redirectTarget?: string;
  }): Promise<CashfreeCheckoutResult>;
}

declare global {
  interface Window {
    Cashfree?: (config: { mode: 'sandbox' | 'production' }) => CashfreeInstance;
  }
}

export function loadCashfree(): Promise<void> {
  return loadScriptOnce(CHECKOUT_SRC, 'Cashfree');
}

/**
 * Open Cashfree's checkout as an in-page modal.
 *
 * `_modal` keeps the respondent on this page for card and UPI; some methods
 * (netbanking, a few wallets) still force a redirect, which comes back as
 * `redirect: true` and is treated as success-pending — the webhook confirms.
 */
export async function openCashfreeCheckout(payment: PaymentRequired): Promise<CheckoutOutcome> {
  await loadCashfree();
  const Cashfree = window.Cashfree;
  if (!Cashfree) throw new Error('Payment window is unavailable');
  if (!payment.paymentSessionId) throw new Error('Payment session is missing');

  unlockForCheckout();

  try {
    const cashfree = Cashfree({ mode: payment.mode === 'live' ? 'production' : 'sandbox' });

    const result = await cashfree.checkout({
      paymentSessionId: payment.paymentSessionId,
      redirectTarget: '_modal',
    });

    if (result.error) {
      return {
        ok: false,
        reason: result.error.message ?? 'The payment did not go through. Nothing was charged.',
      };
    }

    if (result.redirect) return { ok: true };
    if (result.paymentDetails) return { ok: true };

    return { ok: false, reason: 'Payment was cancelled.' };
  } finally {
    relockAfterCheckout();
  }
}

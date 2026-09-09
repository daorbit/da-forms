import type { PaymentRequired } from '@/types';
import type { CheckoutOutcome } from './razorpay';

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

let loader: Promise<void> | null = null;

 
export function loadCashfree(): Promise<void> {
  if (window.Cashfree) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loader = null;
      reject(new Error('Could not load the payment window. Check your connection and try again.'));
    };
    document.body.appendChild(script);
  });

  return loader;
}

 
export async function openCashfreeCheckout(payment: PaymentRequired): Promise<CheckoutOutcome> {
  await loadCashfree();
  const Cashfree = window.Cashfree;
  if (!Cashfree) throw new Error('Payment window is unavailable');
  if (!payment.paymentSessionId) throw new Error('Payment session is missing');
 
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
}

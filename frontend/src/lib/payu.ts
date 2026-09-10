import type { PaymentRequired } from '@/types';
import type { CheckoutOutcome } from './razorpay';
import { loadScriptOnce, unlockForCheckout, relockAfterCheckout } from './checkoutShell';

 
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
    sessionStorage.removeItem(PENDING_KEY);
    return pending.formId === formId ? pending : null;
  } catch {
    return null;
  }
}

/* -------------------------------- Bolt SDK -------------------------------- */

const BOLT_SRC_LIVE = 'https://jssdk.payu.in/bolt/bolt.min.js';
const BOLT_SRC_TEST = 'https://jssdk-uat.payu.in/bolt/bolt.min.js';

interface BoltResponse {
  txnStatus?: 'SUCCESS' | 'FAILED' | 'CANCEL';
  mihpayid?: string;
  status?: string;
  error_Message?: string;
  [key: string]: unknown;
}

interface BoltSDK {
  launch(
    data: Record<string, string>,
    handlers: {
      responseHandler: (response: BoltResponse) => void;
      catchException: (response: BoltResponse) => void;
    },
  ): void;
}

declare global {
  interface Window {
    bolt?: BoltSDK;
  }
}

function loadBolt(mode: PaymentRequired['mode']): Promise<void> {
  return loadScriptOnce(mode === 'live' ? BOLT_SRC_LIVE : BOLT_SRC_TEST, 'bolt');
}

/**
 * Open PayU's Bolt (Checkout Plus) modal.
 *
 * Bolt keeps the respondent on this page: the checkout is a modal served from
 * PayU, PCI handled on their side. It takes exactly the fields the server
 * already builds for the classic flow — same SHA-512 hash — so nothing changes
 * on the backend.
 *
 * On a completed payment Bolt still navigates to `surl`; the promise settles
 * before that with `ok: true` so the caller can show its own confirmation, and
 * the session-storage recovery above covers the reload.
 */
export async function openPayuCheckout(payment: PaymentRequired): Promise<CheckoutOutcome> {
  const f = payment.redirectFields;
  if (!f || !f.key || !f.txnid || !f.hash) {
    return {
      ok: false,
      reason: 'This payment could not be started. Nothing was charged.',
    };
  }

  await loadBolt(payment.mode);
  const bolt = window.bolt;
  if (!bolt) {
    return { ok: false, reason: 'Payment window is unavailable' };
  }

  unlockForCheckout();

  return new Promise<CheckoutOutcome>((resolve) => {
    let settled = false;
    const settle = (outcome: CheckoutOutcome) => {
      if (settled) return;
      settled = true;
      relockAfterCheckout();
      resolve(outcome);
    };

    bolt.launch(
      {
        key: f.key,
        txnid: f.txnid,
        amount: f.amount,
        productinfo: f.productinfo,
        firstname: f.firstname,
        email: f.email,
        phone: f.phone ?? '',
        surl: f.surl,
        furl: f.furl,
        hash: f.hash,
        udf1: f.udf1 ?? '',
        udf2: f.udf2 ?? '',
        udf3: f.udf3 ?? '',
        udf4: f.udf4 ?? '',
        udf5: f.udf5 ?? '',
      },
      {
        responseHandler: (response) => {
          if (response.txnStatus === 'SUCCESS') {
            settle({ ok: true, paymentId: response.mihpayid });
          } else if (response.txnStatus === 'CANCEL') {
            settle({ ok: false, reason: 'Payment was cancelled.' });
          } else {
            settle({
              ok: false,
              reason:
                response.error_Message ??
                'The payment did not go through. Nothing was charged.',
            });
          }
        },
        catchException: (response) => {
          settle({
            ok: false,
            reason:
              response.error_Message ??
              'The payment window ran into a problem. Nothing was charged.',
          });
        },
      },
    );
  });
}

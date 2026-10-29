import { env } from '../config/env.js';

const TIMEOUT_MS = 15_000;

export interface PaymentInvoiceRequest {
  formId: string;
  formTitle: string;
  submissionId: string;
  paymentId: string;
  description: string;
  amount: number;
  currency: string;
  paidAt: string;
  taxRate: number;
  payer: { name: string; email: string; phone: string };
}

export interface CreatedInvoice {
  id: string;
  number: string;
  shareUrl: string;
}

export type InvoiceOutcome =
  | { ok: true; invoice: CreatedInvoice }
  | { ok: false; status: number; code: string; error: string };

export function invoicingConfigured(): boolean {
  return Boolean(env.invoicesApiUrl && env.formsInvoiceSecret);
}

export async function createPaymentInvoice(
  workspaceId: string,
  request: PaymentInvoiceRequest
): Promise<InvoiceOutcome> {
  if (!invoicingConfigured()) {
    return { ok: false, status: 503, code: 'not_configured', error: 'Invoicing is not available right now.' };
  }

  try {
    const res = await fetch(
      `${env.invoicesApiUrl}/api/internal/forms/workspaces/${encodeURIComponent(workspaceId)}/invoices`,
      {
        method: 'POST',
        headers: { authorization: `Bearer ${env.formsInvoiceSecret}`, 'content-type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );
    const body = (await res.json().catch(() => null)) as
      | (Partial<CreatedInvoice> & { error?: string; message?: string })
      | null;

    if (res.ok && body?.id && body.number && body.shareUrl) {
      return { ok: true, invoice: { id: body.id, number: body.number, shareUrl: body.shareUrl } };
    }
    return {
      ok: false,
      status: res.status,
      code: body?.error ?? 'invoice_failed',
      error: body?.message ?? 'The invoice could not be created.',
    };
  } catch (err) {
    console.error('[invoicing] create failed:', err);
    return { ok: false, status: 502, code: 'unreachable', error: 'Invoicing could not be reached.' };
  }
}

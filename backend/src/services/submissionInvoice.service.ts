import type { Types } from 'mongoose';
import type { FormDocument } from '../models/form.model.js';
import { SubmissionModel, type SubmissionInvoice } from '../models/submission.model.js';
import { createPaymentInvoice } from '../lib/invoicing.js';
import { getFormLimits } from '../lib/quantalog.js';
import { activePaymentField, findCustomerDetails } from './payment.service.js';

export type IssueInvoiceOutcome =
  | { ok: true; invoice: SubmissionInvoice }
  | { ok: false; status: number; code: string; error: string };

const MINOR_UNITS = 100;

function failure(status: number, code: string, error: string): IssueInvoiceOutcome {
  return { ok: false, status, code, error };
}

export async function issueSubmissionInvoice(
  form: FormDocument & { _id: unknown },
  submissionId: string
): Promise<IssueInvoiceOutcome> {
  const submission = await SubmissionModel.findOne({ _id: submissionId, formId: form._id as Types.ObjectId, status: 'complete' })
    .select('data payment invoice')
    .lean();
  if (!submission) return failure(404, 'not_found', 'Response not found');
  if (submission.invoice?.status === 'created') return { ok: true, invoice: submission.invoice };

  const payment = submission.payment;
  if (payment?.status !== 'paid') return failure(422, 'not_paid', 'Only paid responses can be invoiced');

  const payField = activePaymentField(form.fields, submission.data);
  if (!payField?.pay?.invoice?.enabled) return failure(422, 'invoicing_off', 'Invoicing is off for this form');

  const limits = await getFormLimits(form.workspaceId);
  if (!limits?.invoicingEnabled) return failure(403, 'app_off', 'Turn on the Invoicing app to create invoices');

  const details = findCustomerDetails(form.fields, submission.data);
  const outcome = await createPaymentInvoice(form.workspaceId, {
    formId: String(form._id),
    formTitle: form.title,
    submissionId: String(submission._id),
    paymentId: payment.paymentId ?? payment.orderId,
    description: payField.pay.description || form.title,
    amount: payment.amount / MINOR_UNITS,
    currency: payment.currency,
    paidAt: (payment.paidAt ?? new Date()).toISOString(),
    taxRate: payField.pay.invoice.taxRate ?? 0,
    payer: {
      name: details.name ?? '',
      email: details.email ?? payment.payerEmail ?? '',
      phone: details.phone ?? payment.payerContact ?? '',
    },
  });

  const stored: SubmissionInvoice = outcome.ok
    ? { status: 'created', ...outcome.invoice, at: new Date() }
    : { status: 'failed', error: outcome.error, at: new Date() };
  await SubmissionModel.updateOne({ _id: submission._id }, { $set: { invoice: stored } });

  return outcome.ok ? { ok: true, invoice: stored } : outcome;
}

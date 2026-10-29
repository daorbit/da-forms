import type { FormDocument } from '../models/form.model.js';
import type { SubmissionBooking, SubmissionPayment } from '../models/submission.model.js';
import { runAfterResponse } from '../lib/afterResponse.js';
import { recordSubmission } from '../lib/quantalog.js';
import { sendSubmissionNotifications } from './notification.service.js';
import { deliverWebhook } from './webhook.service.js';
import { syncSubmissionToSheet } from './sheetsSync.service.js';
import { issueSubmissionInvoice } from './submissionInvoice.service.js';

const EFFECT_NAMES = ['notifications', 'webhook', 'google-sheets', 'quota', 'invoice'] as const;

export interface SubmissionEffectsInput {
  form: FormDocument & { _id: unknown };
  data: Record<string, string>;
  submissionId: string;
  payment?: SubmissionPayment;
  booking?: SubmissionBooking;
  emailsAllowed: boolean;
  allowEditLink: boolean;
}

async function runEffects(input: SubmissionEffectsInput): Promise<void> {
  const { form, data, submissionId, payment, booking, emailsAllowed, allowEditLink } = input;

  const results = await Promise.allSettled([
    sendSubmissionNotifications(
      form,
      data,
      payment,
      allowEditLink ? submissionId : undefined,
      allowEditLink ? String(form._id) : undefined,
      booking,
      emailsAllowed
    ),
    deliverWebhook(form, data, submissionId, payment),
    syncSubmissionToSheet(form, data, submissionId, payment, booking),
    recordSubmission(form.workspaceId),
    payment?.status === 'paid' ? issueSubmissionInvoice(form, submissionId) : Promise.resolve(),
  ]);

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`[submission ${submissionId}] ${EFFECT_NAMES[i]} failed:`, result.reason);
    }
  });
}

export function queueSubmissionEffects(input: SubmissionEffectsInput): void {
  runAfterResponse(`submission ${input.submissionId} effects`, () => runEffects(input));
}

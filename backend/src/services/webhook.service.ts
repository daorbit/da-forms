import { createHmac } from 'node:crypto';
import { FormModel, type FormDocument } from '../models/form.model.js';
import type { SubmissionPayment } from '../models/submission.model.js';
import { decrypt } from '../lib/crypto.js';
import { getWebhookEnabled } from './workspaceSettings.service.js';

const DELIVERY_TIMEOUT_MS = 8_000;

interface WebhookPayload {
  formId: string;
  submissionId: string;
  submittedAt: string;
  data: Record<string, string>;
  payment?: SubmissionPayment;
}

export async function deliverWebhook(
  form: Pick<FormDocument, 'webhook' | 'workspaceId'> & { _id: unknown },
  data: Record<string, string>,
  submissionId: string,
  payment?: SubmissionPayment
): Promise<void> {
  const webhook = form.webhook;
  if (!webhook?.enabled || !webhook.url) return;

  if (!(await getWebhookEnabled(form.workspaceId))) return;

  const payload: WebhookPayload = {
    formId: String(form._id),
    submissionId,
    submittedAt: new Date().toISOString(),
    data,
    ...(payment ? { payment } : {}),
  };
  const body = JSON.stringify(payload);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (webhook.secretEnc) {

    const secret = decrypt(webhook.secretEnc);
    headers['X-Da-Forms-Signature'] = createHmac('sha256', secret).update(body).digest('hex');
  }

  let result: { status: 'ok' | 'failed'; error?: string };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
    try {
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });
      result = res.ok
        ? { status: 'ok' }
        : { status: 'failed', error: `HTTP ${res.status}` };
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    result = { status: 'failed', error: err instanceof Error ? err.message : 'Request failed' };
  }

  await FormModel.updateOne(
    { _id: form._id },
    {
      $set: {
        'webhook.lastStatus': result.status,
        'webhook.lastAttemptAt': new Date(),
        'webhook.lastError': result.error ?? null,
      },
    }
  ).catch(() => {

  });
}

import { sendMail, mailConfigured } from '../lib/mailer.js';
import type { FormDocument, FormField } from '../models/form.model.js';

/** Every field in document order, grids included — mirrors `flattenFields` in form.service. */
function flattenFields(fields: FormField[]): FormField[] {
  return fields.flatMap((field) =>
    field.type === 'grid'
      ? [field, ...(field.columns ?? []).flatMap(flattenFields)]
      : [field]
  );
}

/** Replaces `{{field:<id>}}` with that field's submitted answer, blank if unanswered. */
function fillPlaceholders(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{\s*field:([\w-]+)\s*\}\}/g, (_, fieldId: string) => data[fieldId] ?? '');
}

function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/**
 * Sends the confirmation and/or owner-alert emails configured on a form, for
 * one submission.
 *
 * Called after the submission is already stored, and never lets a mail
 * failure surface as a submit failure — the respondent's data is saved either
 * way, so the caller only logs, it doesn't rethrow.
 */
export async function sendSubmissionNotifications(
  form: FormDocument,
  data: Record<string, string>
): Promise<void> {
  const notifications = form.notifications;
  if (!notifications || !mailConfigured()) return;

  const jobs: Promise<void>[] = [];

  if (notifications.respondentEnabled && notifications.respondentEmailFieldId) {
    const fields = flattenFields(form.fields);
    const emailField = fields.find(
      (f) => f.id === notifications.respondentEmailFieldId && f.type === 'email'
    );
    const to = emailField ? data[emailField.id] : undefined;
    if (to) {
      const subject = fillPlaceholders(notifications.respondentSubject || 'Thanks for your submission', data);
      const body = fillPlaceholders(
        notifications.respondentBody || 'Thanks — we received your submission.',
        data
      );
      jobs.push(sendMail(to, subject, textToHtml(body), body));
    }
  }

  if (notifications.ownerEnabled && notifications.ownerEmails?.length) {
    const subject = notifications.ownerSubject || `New submission: ${form.title}`;
    const body = flattenFields(form.fields)
      .filter((f) => data[f.id] !== undefined)
      .map((f) => `${f.label || f.id}: ${data[f.id]}`)
      .join('\n');
    for (const to of notifications.ownerEmails) {
      jobs.push(sendMail(to, subject, textToHtml(body), body));
    }
  }

  const results = await Promise.allSettled(jobs);
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[notifications] failed to send submission email:', result.reason);
    }
  }
}

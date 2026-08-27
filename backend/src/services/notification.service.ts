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

/**
 * Replaces `{{Field Label}}` with that field's submitted answer, blank if
 * unanswered or if no field has that exact label.
 *
 * Matched by label rather than id: the composer inserts the name someone
 * typed for the field, not its internal id, so this is what has to resolve at
 * send time. A field renamed after the template was written silently stops
 * matching — accepted as the cost of a placeholder a human can actually read
 * and type.
 */
function fillPlaceholders(template: string, fields: FormField[], data: Record<string, string>): string {
  const byLabel = new Map(flattenFields(fields).map((f) => [f.label?.trim(), f.id]));
  return template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, label: string) => {
    const fieldId = byLabel.get(label.trim());
    return fieldId !== undefined ? data[fieldId] ?? '' : match;
  });
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
      const subject = fillPlaceholders(
        notifications.respondentSubject || 'Thanks for your submission',
        form.fields,
        data
      );
      const body = fillPlaceholders(
        notifications.respondentBody || 'Thanks — we received your submission.',
        form.fields,
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

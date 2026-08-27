import { sendMail, mailConfigured } from '../lib/mailer.js';
import { renderEmail } from '../lib/emailTemplates.js';
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

/** Every answered field as a label/value pair, in the order they appear on the form. */
function answersOf(fields: FormField[], data: Record<string, string>) {
  return flattenFields(fields)
    .filter((f) => f.label && data[f.id] !== undefined && data[f.id] !== '')
    .map((f) => ({ label: f.label, value: data[f.id] }));
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
      const html = renderEmail({
        layout: notifications.respondentLayout,
        formName: form.title,
        body,
        answers: answersOf(form.fields, data),
        cta: notifications.respondentCtaHref
          ? { label: notifications.respondentCtaLabel || 'Continue', href: notifications.respondentCtaHref }
          : undefined,
        accent: form.theme?.accentColor,
      });
      jobs.push(sendMail(to, subject, html, body));
    }
  }

  if (notifications.ownerEnabled && notifications.ownerEmails?.length) {
    const subject = notifications.ownerSubject || `New submission: ${form.title}`;
    const answers = answersOf(form.fields, data);
    // The owner's own alert is always the receipt: it exists to carry the
    // answers, and there is no author-written body to lay out around them.
    const text = answers.map((a) => `${a.label}: ${a.value}`).join('\n');
    const html = renderEmail({
      layout: 'receipt',
      formName: form.title,
      body: `A new response came in on ${form.title}.`,
      answers,
      accent: form.theme?.accentColor,
    });
    for (const to of notifications.ownerEmails) {
      jobs.push(sendMail(to, subject, html, text));
    }
  }

  const results = await Promise.allSettled(jobs);
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[notifications] failed to send submission email:', result.reason);
    }
  }
}

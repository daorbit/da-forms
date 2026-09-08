import { sendMail, mailConfigured } from '../lib/mailer.js';
import { renderEmail } from '../lib/emailTemplates.js';
import type { FormDocument, FormField } from '../models/form.model.js';
import type { SubmissionPayment } from '../models/submission.model.js';
import { flattenFields, fillPlaceholders, repeaterText } from '../lib/pipe.js';
import { mintEditToken } from '../lib/edit-token.js';
import { env } from '../config/env.js';


 
export async function sendResumeLink(
  to: string,
  form: Pick<FormDocument, 'title' | 'theme'>,
  link: string
): Promise<void> {
  if (!mailConfigured()) return;

  const body = `You can pick up where you left off on ${form.title}. Your answers are saved.`;
  const html = renderEmail({
    layout: 'nextSteps',
    formName: form.title,
    body,
    cta: { label: 'Continue where you left off', href: link },
    accent: form.theme?.accentColor,
  });

  // Awaited, unlike the submission notifications: this one was requested by
  // someone watching a button, and whether it sent is the answer to what they
  // just clicked.
  await sendMail(to, `Finish your response to ${form.title}`, html, `${body}\n\n${link}`);
}

/** Minor units to a readable figure — 50000 paise reads as ₹500.00. */
function formatPaid(payment: SubmissionPayment): string {
  const major = (payment.amount / 100).toFixed(2);
  const amount = payment.currency === 'INR' ? `₹${major}` : `${major} ${payment.currency}`;
  return payment.method ? `${amount} (${payment.method.toUpperCase()})` : amount;
}

/** Every answered field as a label/value pair, in the order they appear on the form. */
function answersOf(
  fields: FormField[],
  data: Record<string, string>,
  payment?: SubmissionPayment
) {
  return flattenFields(fields)
    .filter((f) => {
      // A paid payment field earns a row even though it has no answer in
      // `data` — otherwise someone who just paid gets a receipt that does not
      // mention the payment at all.
      if (f.type === 'payment') return Boolean(f.label && payment?.status === 'paid');
      return Boolean(f.label && data[f.id] !== undefined && data[f.id] !== '');
    })
    .map((f) => ({
      label: f.label,
      value:
        f.type === 'payment' && payment
          ? formatPaid(payment)
          : f.type === 'repeater'
            ? repeaterText(f, data[f.id])
            : data[f.id],
    }));
}

 
export async function sendSubmissionNotifications(
  form: FormDocument,
  data: Record<string, string>,
  /** Present for a paid form — shown as a line in the emailed summary. */
  payment?: SubmissionPayment,
 
  submissionId?: string,
 
  formId?: string
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
 
      const editHref =
        form.allowEdit && submissionId && formId && env.editTokenSecret && env.publicFormBaseUrl
          ? `${env.publicFormBaseUrl}/form/${formId}/view?edit=${mintEditToken(submissionId)}`
          : undefined;

      const html = renderEmail({
        layout: notifications.respondentLayout,
        formName: form.title,
        body,
        answers: answersOf(form.fields, data, payment),
        cta: notifications.respondentCtaHref
          ? { label: notifications.respondentCtaLabel || 'Continue', href: notifications.respondentCtaHref }
          : editHref
            ? { label: 'Edit your response', href: editHref }
            : undefined,
        accent: form.theme?.accentColor,
      });
      jobs.push(sendMail(to, subject, html, body));
    }
  }

  if (notifications.ownerEnabled && notifications.ownerEmails?.length) {
    const subject = notifications.ownerSubject || `New submission: ${form.title}`;
    const answers = answersOf(form.fields, data, payment);
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

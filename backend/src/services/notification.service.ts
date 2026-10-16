import { sendMail, mailConfigured } from '../lib/mailer.js';
import { renderEmail } from '../lib/emailTemplates.js';
import type { FormDocument } from '../models/form.model.js';
import type { SubmissionBooking, SubmissionPayment } from '../models/submission.model.js';
import { flattenFields, fillPlaceholders } from '../lib/pipe.js';
import { answersOf } from '../lib/submissionAnswers.js';
import { mintEditToken } from '../lib/edit-token.js';
import { env } from '../config/env.js';
import { getBranding, notifyFormSubmission } from '../lib/quantalog.js';
import { bannerAttachment } from '../lib/email-banner.js';
import { sendChatAlert, type ChatAlert } from '../lib/chatAlert.js';
import { chatAlertsOn, telegramAlertsOn } from '../lib/notifyChannels.js';
import { resolveChatConnections } from './appConnection.service.js';
import { sendTelegramAlerts } from './telegramAlert.service.js';
import { routedOwnerEmails } from '../lib/conditions.js';


 
export async function sendResumeLink(
  workspaceId: string,
  to: string,
  form: Pick<FormDocument, 'title' | 'theme'>,
  link: string
): Promise<void> {
  if (!(await mailConfigured(workspaceId))) return;

  const body = `You can pick up where you left off on ${form.title}. Your answers are saved.`;
  const html = renderEmail({
    layout: 'nextSteps',
    formName: form.title,
    body,
    cta: { label: 'Continue where you left off', href: link },
    accent: form.theme?.accentColor,
  });

 
  await sendMail(workspaceId, to, `Finish your response to ${form.title}`, html, `${body}\n\n${link}`);
}

 
async function sendEmailNotifications(
  form: FormDocument & { _id: unknown },
  data: Record<string, string>,
  /** Present for a paid form — shown as a line in the emailed summary. */
  payment?: SubmissionPayment,

  submissionId?: string,

  formId?: string,
  booking?: SubmissionBooking
): Promise<void> {
  const notifications = form.notifications;
  if (!notifications) return;
  if (!notifications.respondentEnabled && !notifications.ownerEnabled) return;

  if (!(await mailConfigured(form.workspaceId))) {
    if (notifications.respondentEnabled || notifications.ownerEnabled) {
 
      console.warn(
        `[notifications] workspace ${form.workspaceId} has notifications on but no usable email app — nothing sent (see [apps] logs above for whether a connection failed to decrypt)`
      );
    }
    return;
  }

 
  const brand = await getBranding(form.workspaceId);
  const poweredBy = brand.showPoweredBy ? brand.poweredByLabel : undefined;
  // What opens the card: the workspace's mark and name, not the form's title.
  const sender = { name: brand.name, logoUrl: brand.logoUrl, accentColor: brand.accentColor };

  const jobs: Promise<void>[] = [];

  if (notifications.respondentEnabled && notifications.respondentEmailFieldId) {
    const fields = flattenFields(form.fields);
    const emailField = fields.find(
      (f) => f.id === notifications.respondentEmailFieldId && f.type === 'email'
    );
    const to = emailField ? data[emailField.id] : undefined;
    const formRef = formId ?? form.title;
    if (!emailField) {
 
      console.warn(
        `[notifications] form ${formRef}: respondent field ${notifications.respondentEmailFieldId} is missing or not an email field — no confirmation sent`
      );
    } else if (!to) {
      console.warn(
        `[notifications] form ${formRef}: respondent left ${emailField.id} blank — no confirmation sent`
      );
    }
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
        form.allowEdit && !booking && submissionId && formId && env.editTokenSecret && env.publicFormBaseUrl
          ? `${env.publicFormBaseUrl}/form/${formId}/view?edit=${mintEditToken(submissionId)}`
          : undefined;

      const html = renderEmail({
        layout: notifications.respondentLayout,
        formName: form.title,
        body,
        answers: answersOf(form.fields, data, payment, booking),
        cta: notifications.respondentCtaHref
          ? { label: notifications.respondentCtaLabel || 'Continue', href: notifications.respondentCtaHref }
          : editHref
            ? { label: 'Edit your response', href: editHref }
            : undefined,
        accent: form.theme?.accentColor,
        brand: sender,
        poweredBy,
        banner: 'submission-received',
      });
      const banner = bannerAttachment('submission-received');
      jobs.push(
        sendMail(form.workspaceId, to, subject, html, body, banner ? [banner] : [])
      );
    }
  }

  const ownerRecipients = [
    ...new Set(
      [...(notifications.ownerEmails ?? []), ...routedOwnerEmails(notifications.ownerRoutes, data)]
        .map((email) => email.trim())
        .filter(Boolean)
    ),
  ];

  if (notifications.ownerEnabled && ownerRecipients.length) {
    const subject = notifications.ownerSubject || `New submission: ${form.title}`;
    const answers = answersOf(form.fields, data, payment, booking);
    // The owner's own alert is always the receipt: it exists to carry the
    // answers, and there is no author-written body to lay out around them.
    const text = answers.map((a) => `${a.label}: ${a.value}`).join('\n');
    const html = renderEmail({
      layout: 'receipt',
      formName: form.title,
      body: `A new response came in on ${form.title}.`,
      answers,
      accent: form.theme?.accentColor,
      brand: sender,
      poweredBy,
      banner: 'new-submission',
    });
    const banner = bannerAttachment('new-submission');
    for (const to of ownerRecipients) {
      jobs.push(
        sendMail(form.workspaceId, to, subject, html, text, banner ? [banner] : [])
      );
    }
  }

  const results = await Promise.allSettled(jobs);
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[notifications] failed to send submission email:', result.reason);
    }
  }
}

async function sendChatNotifications(form: FormDocument & { _id: unknown }, alert: ChatAlert): Promise<void> {
  if (!chatAlertsOn(form.notifications)) return;
  const connections = await resolveChatConnections(form.workspaceId);
  const results = await Promise.allSettled(connections.map((c) => sendChatAlert(c, alert)));
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[notifications] failed to post chat alert:', result.reason);
    }
  }
}

export async function sendSubmissionNotifications(
  form: FormDocument & { _id: unknown },
  data: Record<string, string>,
  payment?: SubmissionPayment,
  submissionId?: string,
  formId?: string,
  booking?: SubmissionBooking,
  emailsAllowed = true
): Promise<void> {
  const notifications = form.notifications;
  const answers = answersOf(form.fields, data, payment, booking);
  const alert: ChatAlert = { title: `New submission: ${form.title}`, answers };

  const results = await Promise.allSettled([
    emailsAllowed ? sendEmailNotifications(form, data, payment, submissionId, formId, booking) : null,
    notifications?.ownerInAppEnabled
      ? notifyFormSubmission(form.workspaceId, formId ?? String(form._id), form.title, answers)
      : null,
    telegramAlertsOn(notifications) ? sendTelegramAlerts(form.workspaceId, alert) : null,
    sendChatNotifications(form, alert),
  ]);
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[notifications] a submission notification failed:', result.reason);
    }
  }
}

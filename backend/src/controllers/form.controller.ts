import type { RequestHandler, Request } from 'express';
import { createHash } from 'node:crypto';
import * as formService from '../services/form.service.js';
import * as paymentService from '../services/payment.service.js';
import * as workspaceSettingsService from '../services/workspaceSettings.service.js';
import { sendSubmissionNotifications } from '../services/notification.service.js';
import { getFormLimits, recordSubmission } from '../lib/quantalog.js';
import { planLimit } from '../lib/plan-limit.js';

/**
 * IP + user-agent, hashed. Not identity-grade — just enough to tell "same
 * browser reopening the link" from "a different visitor," for view dedup.
 */
function fingerprintOf(req: Request) {
  const ip = req.ip ?? '';
  const ua = req.get('user-agent') ?? '';
  return createHash('sha256').update(`${ip}:${ua}`).digest('hex');
}

/** Every workspace-scoped route carries the id in the path. */
function workspaceIdOf(req: { params: Record<string, string> }) {
  return req.params.workspaceId;
}

export const listForms: RequestHandler = async (req, res) => {
  const { page, limit, q, sort, status } = req.query as Record<string, string | undefined>;
  const result = await formService.listForms(workspaceIdOf(req), {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    q,
    sort: sort as never,
    // Anything other than the two real states is ignored rather than passed
    // through to the query.
    status: status === 'published' || status === 'draft' ? status : undefined,
  });
  res.json(result);
};

export const getForm: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  // A form is only reachable through the workspace that owns it.
  if (form.workspaceId !== workspaceIdOf(req)) {
    return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  }
  res.json(form);
};

export const createForm: RequestHandler = async (req, res) => {
  const {
    name,
    title,
    description,
    fields,
    redirectUrl,
    thankYouMessage,
    hideHeader,
    headerAlign,
    labelPlacement,
    submitLabel,
    submitButtonSize,
    submitButtonWidth,
    submitButtonAlign,
    theme,
    steps,
    stepIndicator,
    showStepHeadings,
    collectIp,
    notifications,
  } = req.body;

  const workspaceId = workspaceIdOf(req);
  const limits = await getFormLimits(workspaceId);
  // Unknown limits refuse the create, unlike a submission, which is accepted.
  // Nobody loses anything they already had by being asked to try again, and a
  // cap that can be stepped around by catching an outage is not a cap.
  if (limits) {
    const count = await formService.countForms(workspaceId);
    if (count >= limits.maxForms) {
      return planLimit(
        res,
        `Your plan includes ${limits.maxForms} form${limits.maxForms === 1 ? '' : 's'} — upgrade to build more.`,
        {
          kind: 'forms',
          label: 'Forms',
          used: count,
          quota: limits.maxForms,
          plan: limits.planName ?? limits.plan,
        }
      );
    }
  }

  const form = await formService.createForm({
    name: name ?? title,
    title,
    description,
    fields: fields ?? [],
    redirectUrl,
    thankYouMessage,
    hideHeader,
    headerAlign,
    labelPlacement,
    submitLabel,
    submitButtonSize,
    submitButtonWidth,
    submitButtonAlign,
    theme,
    steps,
    stepIndicator,
    showStepHeadings,
    collectIp,
    notifications,
    workspaceId,
  });
  res.status(201).json(form);
};

export const updateForm: RequestHandler = async (req, res) => {
  // `workspaceId` is never taken from the body: a form cannot be moved between
  // workspaces by editing it.
  const { workspaceId: _ignored, ...patch } = req.body;
  const form = await formService.updateForm(req.params.id, workspaceIdOf(req), patch);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  res.json(form);
};

export const deleteForm: RequestHandler = async (req, res) => {
  const form = await formService.deleteForm(req.params.id, workspaceIdOf(req));
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  res.status(204).send();
};

export const listSubmissions: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form || form.workspaceId !== workspaceIdOf(req)) {
    return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  }
  const { page, limit, status, from, to } = req.query as Record<string, string | undefined>;
  const result = await formService.listSubmissions(req.params.id, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    status: status as never,
    from,
    to,
  });
  res.json(result);
};

export const updateSubmission: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form || form.workspaceId !== workspaceIdOf(req)) {
    return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  }
  const { read, starred } = req.body;
  const submission = await formService.updateSubmission(req.params.subId, req.params.id, {
    read,
    starred,
  });
  if (!submission) return res.status(404).json({ error: 'not_found', message: 'Submission not found' });
  res.json(submission);
};

export const deleteSubmission: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form || form.workspaceId !== workspaceIdOf(req)) {
    return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  }
  const submission = await formService.deleteSubmission(req.params.subId, req.params.id);
  if (!submission) return res.status(404).json({ error: 'not_found', message: 'Submission not found' });
  res.status(204).send();
};

export const getAnalytics: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form || form.workspaceId !== workspaceIdOf(req)) {
    return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  }
  const [submissionCount, sources] = await Promise.all([
    formService.submissionCount(req.params.id),
    formService.sourceBreakdown(req.params.id),
  ]);
  const viewCount = form.viewCount ?? 0;
  const completionRate = viewCount > 0 ? submissionCount / viewCount : 0;
  res.json({ viewCount, submissionCount, completionRate, sources });
};

/* ---- Public routes: no workspace in the path ---- */

/** The form as respondents see it. Reachable by id alone — that is the share link. */
export const getPublicForm: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  res.json(form);
};

export const recordView: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  await formService.recordView(req.params.id, fingerprintOf(req));
  res.status(204).send();
};

export const submitForm: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  if (form.status !== 'published') {
    return res.status(403).json({ error: 'not_published', message: 'This form is not accepting responses yet' });
  }

  // `_hp` is a field real respondents never see or fill — a bot filling
  // every input trips it. It is not part of the form's own data and is
  // stripped before the submission is stored.
  const { _hp, ...data } = req.body;
  if (_hp) {
    return res.status(400).json({ error: 'spam_detected', message: 'Submission rejected' });
  }

  // Unknown limits accept the response, unlike form creation, which refuses.
  // If Quantalog is unreachable the cost of guessing wrong is one row over
  // quota; the cost of guessing the other way is a lead that a real visitor
  // already took the trouble to type, lost for good.
  const limits = await getFormLimits(form.workspaceId);
  // Deliberately not `planLimit`: the person hitting this is the respondent
  // filling the form in, not the customer who owns the plan. Nudging a stranger
  // towards someone else's billing page would be nonsense, so this stays a
  // neutral "not accepting responses" with no code and no upgrade path.
  if (limits && limits.submissionsUsed >= limits.monthlySubmissionQuota + limits.submissionCredits) {
    return res.status(402).json({
      error: 'submission_quota_reached',
      message: 'This form is not accepting responses right now. Please try again later.',
    });
  }

  const sourceUrl = req.get('referer');
  const payField = paymentService.findPaymentField(form.fields);

  try {
    // A form that charges takes a different path: the response is stored, but
    // held back until Razorpay confirms the money arrived. Nothing downstream
    // — quota, emails — runs until then.
    if (payField) {
      const amount = paymentService.resolveAmount(payField, data, form.fields);
      const currency = payField.pay?.currency ?? 'INR';
      const credentials = await paymentService.getCredentials(form.workspaceId);

      const submission = await formService.submitForm(req.params.id, form.fields, data, sourceUrl, {
        provider: 'razorpay',
        // Replaced with the real order id immediately below. Written first
        // because the receipt Razorpay stores is this submission's id, and
        // that only exists once the row does.
        orderId: `pending_${Date.now()}`,
        amount,
        currency,
        status: 'created',
      });

      const order = await paymentService.createOrder(credentials, {
        amount,
        currency,
        receipt: String(submission._id),
        notes: { formId: String(form._id), workspaceId: form.workspaceId },
      });

      await formService.attachOrderId(submission._id, order.id);

      return res.status(202).json({
        paymentRequired: true,
        submissionId: submission._id,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: credentials.keyId,
        description: payField.pay?.description ?? form.title,
      });
    }

    const submission = await formService.submitForm(req.params.id, form.fields, data, sourceUrl);
    res.status(201).json(submission);
    // After responding: the respondent's own confirmation should not make
    // them wait on an SMTP round trip, and a slow or failing mail server must
    // never turn a successful submission into an error response.
    void recordSubmission(form.workspaceId);
    // Notification emails are a paid feature, so a plan without them sends
    // nothing — checked here rather than inside the mailer so an unreachable
    // Quantalog (null limits) still lets a paying customer's mail go out.
    if (!limits || limits.notificationEmails) void sendSubmissionNotifications(form, data);
  } catch (err) {
    if (err instanceof formService.DuplicateValueError) {
      return res.status(409).json({
        error: 'duplicate_value',
        message: err.message,
        fieldId: err.field.id,
      });
    }
    if (err instanceof paymentService.InvalidAmountError) {
      return res.status(400).json({ error: 'invalid_amount', message: err.message });
    }
    if (err instanceof paymentService.PaymentConfigError) {
      // The respondent cannot fix this — it is the form owner's setup that is
      // wrong — so it reads as the form being unavailable rather than as
      // something they typed being rejected.
      console.error('[payments] configuration problem:', err.message);
      return res.status(503).json({
        error: 'payment_unavailable',
        message: 'This form cannot take payments right now. Please try again later.',
      });
    }
    throw err;
  }
};

/**
 * Razorpay telling us a payment settled.
 *
 * This is what actually completes a submission. The browser's own report of
 * success is not trusted for that — it can be fabricated, and it never arrives
 * at all if the respondent closes the tab at the wrong moment.
 *
 * Addressed by workspace rather than by form: a workspace registers this once
 * in its Razorpay dashboard and every paid form it owns is covered. Which form
 * a payment belongs to is discovered from the submission the order id points
 * at, so it does not need to be in the URL.
 */
export const razorpayWebhook: RequestHandler = async (req, res) => {
  const { workspaceId } = req.params;

  const signature = req.get('x-razorpay-signature') ?? '';
  // `express.raw` is mounted on this path, so the body is the exact bytes
  // Razorpay signed. Re-serialised JSON would not match.
  const rawBody = req.body as Buffer;
  if (!Buffer.isBuffer(rawBody)) {
    console.error('[payments] webhook body was parsed — raw parser is not mounted');
    return res.status(500).json({ error: 'server_error', message: 'Webhook misconfigured' });
  }

  let credentials;
  try {
    credentials = await paymentService.getCredentials(workspaceId);
  } catch {
    return res.status(400).json({ error: 'not_configured', message: 'No Razorpay account' });
  }

  if (!credentials.webhookSecret) {
    console.error('[payments] no webhook secret saved for workspace', workspaceId);
    return res.status(400).json({ error: 'not_configured', message: 'No webhook secret' });
  }
  if (!paymentService.verifyWebhookSignature(rawBody, signature, credentials.webhookSecret)) {
    return res.status(401).json({ error: 'bad_signature', message: 'Signature did not verify' });
  }

  const event = JSON.parse(rawBody.toString('utf8')) as {
    event: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          email?: string;
          contact?: string;
          method?: string;
        };
      };
    };
  };
  const entity = event.payload?.payment?.entity;
  const orderId = entity?.order_id;
  const paymentId = entity?.id;

  if (!orderId || !paymentId) return res.status(200).json({ ok: true, ignored: 'no order id' });

  if (event.event === 'payment.failed') {
    await formService.markSubmissionFailed(orderId);
    return res.status(200).json({ ok: true });
  }

  if (event.event !== 'payment.captured' && event.event !== 'order.paid') {
    return res.status(200).json({ ok: true, ignored: event.event });
  }

  // Razorpay always collects a contact number, and usually an email. Kept so a
  // form that asked for neither still leaves the owner able to identify who
  // paid.
  // Which form this belongs to comes from the pending submission the order id
  // points at — the webhook is registered once per workspace and serves them
  // all, so it cannot know the form up front.
  const pending = await formService.getSubmissionByOrderId(orderId);
  if (!pending) return res.status(200).json({ ok: true, ignored: 'unknown order' });

  const form = await formService.getForm(String(pending.formId));
  // A signature verified against this workspace's secret should never resolve
  // to another workspace's form. If it does, something is wrong enough that
  // completing the submission would be the wrong move.
  if (!form || form.workspaceId !== workspaceId) {
    console.error('[payments] order', orderId, 'does not belong to workspace', workspaceId);
    return res.status(200).json({ ok: true, ignored: 'workspace mismatch' });
  }

  const submission = await formService.markSubmissionPaid(orderId, paymentId, {
    payerEmail: entity?.email,
    payerContact: entity?.contact,
    method: entity?.method,
  });
  // Null means a retry of an event already handled. Acknowledged, but nothing
  // runs again — otherwise Razorpay's redelivery would send a second set of
  // confirmation emails for one payment.
  if (!submission) return res.status(200).json({ ok: true, alreadyHandled: true });

  void workspaceSettingsService.markCharged(workspaceId);
  void recordSubmission(workspaceId);
  const limits = await getFormLimits(workspaceId);
  if (!limits || limits.notificationEmails) {
    void sendSubmissionNotifications(form, submission.data);
  }

  res.status(200).json({ ok: true });
};

/**
 * Where the respondent's page checks whether its payment landed.
 *
 * Polled after checkout closes, because the webhook is what completes the
 * submission and it may arrive a moment later than the browser does.
 */
export const getPaymentStatus: RequestHandler = async (req, res) => {
  const submission = await formService.getSubmissionByOrderId(req.params.orderId);
  if (!submission) return res.status(404).json({ error: 'not_found', message: 'Unknown order' });
  res.json({
    status: submission.status,
    paymentStatus: submission.payment?.status ?? 'created',
  });
};

import type { RequestHandler, Request, Response } from 'express';
import { createHash } from 'node:crypto';
import * as formService from '../services/form.service.js';
import * as paymentService from '../services/payment.service.js';
import * as workspaceSettingsService from '../services/workspaceSettings.service.js';
import { sendSubmissionNotifications } from '../services/notification.service.js';
import { getFormLimits, recordSubmission, generateForm as quantalogGenerate } from '../lib/quantalog.js';
import { planLimit } from '../lib/plan-limit.js';
import { turnstileConfigured, verifyTurnstileToken } from '../lib/turnstile.js';
import { readEditToken } from '../lib/edit-token.js';
import { env } from '../config/env.js';

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

/**
 * Copy a form into the same workspace.
 *
 * Counted against the plan's form cap exactly as a create is — a duplicate is
 * a new form, and a cap that can be stepped around by copying instead of
 * creating is not a cap.
 */
export const duplicateForm: RequestHandler = async (req, res) => {
  const workspaceId = workspaceIdOf(req);
  const limits = await getFormLimits(workspaceId);
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

  const copy = await formService.duplicateForm(req.params.id, workspaceId);
  if (!copy) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  res.status(201).json(copy);
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

 
const BULK_ACTION_LIMIT = 200;

function validateBulkIds(ids: unknown, res: Response): ids is string[] {
  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((v) => typeof v === 'string')) {
    res.status(400).json({ error: 'invalid_ids', message: 'ids must be a non-empty array of strings' });
    return false;
  }
  if (ids.length > BULK_ACTION_LIMIT) {
    res.status(400).json({
      error: 'too_many_ids',
      message: `At most ${BULK_ACTION_LIMIT} ids per request`,
    });
    return false;
  }
  return true;
}

export const bulkUpdateSubmissions: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form || form.workspaceId !== workspaceIdOf(req)) {
    return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  }
  const { ids, read, starred } = req.body ?? {};
  if (!validateBulkIds(ids, res)) return;
  if (read === undefined && starred === undefined) {
    return res.status(400).json({ error: 'no_patch', message: 'read or starred must be provided' });
  }
  const { matchedCount } = await formService.bulkUpdateSubmissions(ids, req.params.id, { read, starred });
  res.json({ matchedCount });
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

export const bulkDeleteSubmissions: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form || form.workspaceId !== workspaceIdOf(req)) {
    return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  }
  const ids = req.body?.ids;
  if (!validateBulkIds(ids, res)) return;
  const { deletedCount } = await formService.bulkDeleteSubmissions(ids, req.params.id);
  res.json({ deletedCount });
};

export const getAnalytics: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form || form.workspaceId !== workspaceIdOf(req)) {
    return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  }
  const [submissionCount, sources, dropOff] = await Promise.all([
    formService.submissionCount(req.params.id),
    formService.sourceBreakdown(req.params.id),
    // Empty for a form with autosave off — there is no record of where anyone
    // stopped, and an empty list says that more honestly than a zero would.
    formService.dropOffBreakdown(req.params.id),
  ]);
  const viewCount = form.viewCount ?? 0;
  const completionRate = viewCount > 0 ? submissionCount / viewCount : 0;
  res.json({
    viewCount,
    submissionCount,
    completionRate,
    sources,
    dropOff,
    // So the page can tell "nobody abandoned this form" from "we were never
    // watching", which are the same empty list otherwise.
    partialsEnabled: Boolean(form.collectPartials),
  });
};

/* ---- Public routes: no workspace in the path ---- */

/** The form as respondents see it. Reachable by id alone — that is the share link. */
export const getPublicForm: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });

  const doc = form.toObject();

  /*
   * An allow-list, not the whole document.
   *
   * A share link is opened by strangers, and everything this route returns is
   * readable in their network tab. Sending the stored form outright published
   * `notifications.ownerEmails` — the owner's own address, and any colleague
   * they had alerts going to — to every respondent who ever opened the form.
   *
   * Listing the fields the renderer actually uses means a future setting is
   * private until someone deliberately adds it here, rather than public the
   * moment it is saved.
   */
  const {
    _id,
    title,
    description,
    fields,
    status,
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
    requireCaptcha,
    collectPartials,
    allowEdit,
  } = doc;

  // Sent alongside the form rather than in place of it: the page still needs
  // the title and theme to render a closed notice that looks like the form it
  // belongs to, instead of a bare error on a white page.
  const availability = await formService.availability(form);

  res.json({
    _id,
    title,
    description,
    fields,
    status,
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
    requireCaptcha,
    collectPartials,
    allowEdit,
    availability,
  });
};

/**
 * Resolve an edit link to the submission it names, or say why not.
 *
 * The token is the whole credential — there is no session behind a link in an
 * email — so every refusal is deliberately the same shape and gives away
 * nothing about whether the submission exists.
 */
async function resolveEditToken(token: unknown, formId: string) {
  const read = readEditToken(token);
  if (!read.ok) return { error: read.reason } as const;

  const submission = await formService.getSubmissionById(read.submissionId);
  // Belongs to this form, and is a real response rather than a checkout in
  // flight. A token for another form's submission is refused even though it
  // carries a valid signature.
  if (!submission || String(submission.formId) !== formId || submission.status !== 'complete') {
    return { error: 'invalid' } as const;
  }
  return { submission } as const;
}

/** The answers behind an edit link, so the form can open pre-filled. */
export const getSubmissionForEdit: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  if (!form.allowEdit || !env.editTokenSecret) {
    return res.status(403).json({ error: 'edit_disabled', message: 'This form cannot be edited after sending' });
  }

  const found = await resolveEditToken(req.query.token, req.params.id);
  if ('error' in found) {
    return res.status(found.error === 'expired' ? 410 : 403).json({
      error: found.error === 'expired' ? 'link_expired' : 'invalid_link',
      message:
        found.error === 'expired'
          ? 'This edit link has expired.'
          : 'This edit link is not valid.',
    });
  }

  res.json({ data: found.submission.data, fileMeta: found.submission.fileMeta });
};

/**
 * Save a respondent's changes to their own submission.
 *
 * Payment fields are refused rather than re-charged: an edit that changes what
 * someone owes is a second transaction, and quietly taking more money — or
 * silently keeping the old amount for new answers — are both wrong. Those forms
 * keep `allowEdit` off.
 */
export const updateSubmissionByToken: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  if (!form.allowEdit || !env.editTokenSecret) {
    return res.status(403).json({ error: 'edit_disabled', message: 'This form cannot be edited after sending' });
  }

  const { _token, _fileMeta, ...data } = req.body;

  const found = await resolveEditToken(_token, req.params.id);
  if ('error' in found) {
    return res.status(found.error === 'expired' ? 410 : 403).json({
      error: found.error === 'expired' ? 'link_expired' : 'invalid_link',
      message:
        found.error === 'expired'
          ? 'This edit link has expired.'
          : 'This edit link is not valid.',
    });
  }

  if (paymentService.activePaymentField(form.fields, data)) {
    return res.status(409).json({
      error: 'edit_unsupported',
      message: 'Responses that include a payment cannot be edited.',
    });
  }

  let fileMeta: Record<string, { bytes: number }> | undefined;
  if (typeof _fileMeta === 'string') {
    try {
      fileMeta = JSON.parse(_fileMeta);
    } catch {
      // Cosmetic, as on submit — the edit still saves without it.
    }
  }

  try {
    const updated = await formService.editSubmission(
      String(found.submission._id),
      form.fields,
      data,
      fileMeta
    );
    if (!updated) return res.status(404).json({ error: 'not_found', message: 'Response not found' });
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof formService.DuplicateValueError) {
      return res.status(409).json({
        error: 'duplicate_value',
        message: err.message,
        fieldId: err.field.id,
      });
    }
    throw err;
  }
};

export const recordView: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  await formService.recordView(req.params.id, fingerprintOf(req));
  res.status(204).send();
};

/**
 * Autosave: what this respondent has typed so far.
 *
 * Answers 204 in every non-error case, including when the form has autosave
 * off. The browser is firing this on a timer behind someone who is still
 * typing, and an error it cannot act on would only produce console noise on a
 * form that is working exactly as configured.
 *
 * Deliberately outside the plan's submission quota: a partial is not a
 * response, and metering the act of typing would charge a customer for people
 * who never sent anything.
 */
export const savePartial: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });

  // The owner has to have asked for this. Without the flag the route stores
  // nothing, whatever the browser sends.
  if (!form.collectPartials) return res.status(204).send();

  const state = await formService.availability(form);
  if (!state.open) return res.status(204).send();

  const { _partialKey, _lastFieldId, _lastFieldIndex, ...data } = req.body;
  if (typeof _partialKey !== 'string' || !_partialKey.trim()) {
    return res.status(400).json({ error: 'missing_key', message: 'No draft key' });
  }

  await formService.savePartial(
    req.params.id,
    _partialKey,
    data,
    typeof _lastFieldId === 'string' ? _lastFieldId : undefined,
    typeof _lastFieldIndex === 'number' ? _lastFieldIndex : undefined,
    req.get('referer')
  );
  res.status(204).send();
};

export const submitForm: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  // The same check the public page ran to decide what to render. Repeated here
  // because that one is advisory — a closed form still has a reachable submit
  // endpoint, and this is what actually refuses.
  const state = await formService.availability(form);
  if (!state.open) {
    return res.status(403).json({
      error: state.reason === 'notPublished' ? 'not_published' : 'form_closed',
      message: state.message,
    });
  }

  // `_hp` is a field real respondents never see or fill — a bot filling
  // every input trips it. It is not part of the form's own data and is
  // stripped before the submission is stored.
  // `_retryOrderId` rides along the same way — it names the abandoned attempt
  // this submission replaces, and is no more part of the answers than `_hp`.
  // `_fileMeta` is metadata about the upload answers (currently just byte
  // size, read off Cloudinary's own upload response client-side) rather than
  // an answer itself, so it is split off the same way.
  // `_captcha` is the Turnstile token, stripped for the same reason as the
  // rest: it proves something about the request, it is not an answer.
  // `_partialKey` names this attempt's autosave row so it is promoted rather
  // than duplicated. Stripped like the rest: it identifies the attempt, it is
  // not an answer.
  const {
    _hp,
    _retryOrderId: _ignoredRetry,
    _fileMeta,
    _captcha,
    _partialKey,
    ...data
  } = req.body;
  if (_hp) {
    return res.status(400).json({ error: 'spam_detected', message: 'Submission rejected' });
  }

  // Only when the owner asked for it and the deployment can actually verify.
  // An unconfigured secret means no challenge was rendered either, so failing
  // here would close the form to everyone over a missing env var.
  if (form.requireCaptcha && turnstileConfigured()) {
    const verdict = await verifyTurnstileToken(_captcha, req.ip);
    if (!verdict.ok && verdict.reason === 'invalid') {
      return res.status(400).json({
        error: 'captcha_failed',
        message: 'Could not verify you are human. Please try again.',
      });
    }
    // `unavailable` deliberately falls through and accepts the response.
    // Cloudflare being unreachable is our outage, and the cost of guessing
    // wrong is some spam; the cost of the other guess is every real
    // respondent turned away for the duration — the same trade the quota
    // check below already makes.
  }
  // Sent as a JSON string, not a nested object: the submit payload's own
  // type is `Record<string, string>`, matching every other field, so this
  // rides along the same shape everything else does rather than special-cased.
  let fileMeta: Record<string, { bytes: number }> | undefined;
  if (typeof _fileMeta === 'string') {
    try {
      fileMeta = JSON.parse(_fileMeta);
    } catch {
      // Malformed input from a hand-edited request — the size badge is
      // cosmetic, so the submission still goes through without it.
    }
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
  // Only charges when its own condition is met — someone who picked the free
  // option should not be billed just because the field exists on the form.
  // Evaluated here rather than trusted from the browser, since it decides
  // whether money changes hands.
  const payField = paymentService.activePaymentField(form.fields, data);

  try {
    // A form that charges takes a different path: the response is stored, but
    // held back until Razorpay confirms the money arrived. Nothing downstream
    // — quota, emails — runs until then.
    if (payField) {
      const amount = paymentService.resolveAmount(payField, data, form.fields);
      const currency = payField.pay?.currency ?? 'INR';
      const credentials = await paymentService.getCredentials(form.workspaceId);

      // Someone retrying after a cancelled checkout leaves a pending row
      // behind on every attempt. Dropped here rather than left for the sweep,
      // so three abandoned tries do not become three rows nobody can see but
      // that still hold this respondent's uploads.
      if (req.body._retryOrderId) {
        await formService.discardPendingSubmission(String(req.body._retryOrderId));
      }

      const submission = await formService.submitForm(
        req.params.id,
        form.fields,
        data,
        sourceUrl,
        {
          provider: 'razorpay',
          // Replaced with the real order id immediately below. Written first
          // because the receipt Razorpay stores is this submission's id, and
          // that only exists once the row does.
          orderId: `pending_${Date.now()}`,
          amount,
          currency,
          status: 'created',
        },
        fileMeta,
        typeof _partialKey === 'string' ? _partialKey : undefined
      );

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

    const submission = await formService.submitForm(
      req.params.id,
      form.fields,
      data,
      sourceUrl,
      undefined,
      fileMeta,
      typeof _partialKey === 'string' ? _partialKey : undefined
    );
    res.status(201).json(submission);
    // After responding: the respondent's own confirmation should not make
    // them wait on an SMTP round trip, and a slow or failing mail server must
    // never turn a successful submission into an error response.
    void recordSubmission(form.workspaceId);
    // Notification emails are a paid feature, so a plan without them sends
    // nothing — checked here rather than inside the mailer so an unreachable
    // Quantalog (null limits) still lets a paying customer's mail go out.
    if (!limits || limits.notificationEmails) {
      void sendSubmissionNotifications(
        form,
        data,
        undefined,
        String(submission._id),
        String(form._id)
      );
    }
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
    // The payment rides along so the confirmation actually says what was
    // paid — a receipt that omits the amount is not much of a receipt.
    void sendSubmissionNotifications(form, submission.data, submission.payment);
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

/**
 * Draft a form from a sentence.
 *
 * A pass-through to Quantalog, which owns the model and the AI quota. Nothing
 * is stored: the answer goes back to the editor as a starting point, and it
 * becomes a form only if the person saves it — so a generation they dislike
 * costs them a click, not a row to delete.
 *
 * The demo workspace is refused rather than served. Generation spends a real
 * workspace's AI allowance, and the showcase belongs to no one to spend.
 */
export const generateForm: RequestHandler = async (req, res) => {
  const workspaceId = workspaceIdOf(req);
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';

  if (!prompt) {
    return res.status(400).json({ error: 'prompt_required', message: 'Describe the form you want.' });
  }

  // Present on a follow-up ("add a phone field"). Quantalog validates it
  // before it reaches the model, so nothing is checked here beyond its shape.
  const previous = req.body?.previous && typeof req.body.previous === 'object'
    ? req.body.previous
    : undefined;

  // "edit" comes from the builder's AI drawer, changing a live form; "create"
  // (default) is the generator modal drafting a new one. Quantalog only pulls
  // an "edit" reply back toward the previous form.
  const mode = req.body?.mode === 'edit' ? 'edit' : 'create';

  const result = await quantalogGenerate(workspaceId, prompt, previous, mode);

  if (!result.ok) {
    // The quota refusal is passed through with its code intact, so the editor
    // can offer an upgrade rather than showing a generic failure.
    return res.status(result.status).json({
      error: result.code ?? 'generation_failed',
      message: result.error,
    });
  }

  res.json(result.form);
};

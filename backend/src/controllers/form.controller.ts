import type { RequestHandler, Request, Response } from "express";
import { createHash } from "node:crypto";
import * as formService from "../services/form.service.js";
import * as paymentService from "../services/payment.service.js";
import type { PaymentProvider } from "../models/workspaceSettings.model.js";
import * as workspaceSettingsService from "../services/workspaceSettings.service.js";
import {
  sendSubmissionNotifications,
  sendResumeLink,
} from "../services/notification.service.js";
import { deliverWebhook } from "../services/webhook.service.js";
import { encrypt, isEncryptionConfigured } from "../lib/crypto.js";
import {
  getFormLimits,
  recordSubmission,
  generateForm as quantalogGenerate,
  getBranding,
} from "../lib/quantalog.js";
import { planLimit } from "../lib/plan-limit.js";
import { turnstileConfigured, verifyTurnstileToken } from "../lib/turnstile.js";
import { readEditToken, mintResumeToken } from "../lib/edit-token.js";
import { env } from "../config/env.js";

function fingerprintOf(req: Request) {
  const ip = req.ip ?? "";
  const ua = req.get("user-agent") ?? "";
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex");
}

/** Every workspace-scoped route carries the id in the path. */
function workspaceIdOf(req: { params: Record<string, string> }) {
  return req.params.workspaceId;
}

export const listForms: RequestHandler = async (req, res) => {
  const { page, limit, q, sort, status } = req.query as Record<
    string,
    string | undefined
  >;
  const result = await formService.listForms(workspaceIdOf(req), {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    q,
    sort: sort as never,

    status: status === "published" || status === "draft" ? status : undefined,
  });
  res.json(result);
};

export const getForm: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form)
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  if (form.workspaceId !== workspaceIdOf(req)) {
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  }
  const doc = form.toObject();
  if (doc.webhook?.secretEnc) {
    const { secretEnc: _secretEnc, ...rest } = doc.webhook;
    doc.webhook = { ...rest, hasSecret: true } as typeof doc.webhook & {
      hasSecret: boolean;
    };
  }
  res.json(doc);
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

  if (limits) {
    const count = await formService.countForms(workspaceId);
    if (count >= limits.maxForms) {
      return planLimit(
        res,
        `Your plan includes ${limits.maxForms} form${limits.maxForms === 1 ? "" : "s"} — upgrade to build more.`,
        {
          kind: "forms",
          label: "Forms",
          used: count,
          quota: limits.maxForms,
          plan: limits.planName ?? limits.plan,
        },
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
  const { workspaceId: _ignored, ...patch } = req.body;
  const form = await formService.updateForm(
    req.params.id,
    workspaceIdOf(req),
    patch,
  );
  if (!form)
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  res.json(form);
};

export const duplicateForm: RequestHandler = async (req, res) => {
  const workspaceId = workspaceIdOf(req);
  const limits = await getFormLimits(workspaceId);
  if (limits) {
    const count = await formService.countForms(workspaceId);
    if (count >= limits.maxForms) {
      return planLimit(
        res,
        `Your plan includes ${limits.maxForms} form${limits.maxForms === 1 ? "" : "s"} — upgrade to build more.`,
        {
          kind: "forms",
          label: "Forms",
          used: count,
          quota: limits.maxForms,
          plan: limits.planName ?? limits.plan,
        },
      );
    }
  }

  const copy = await formService.duplicateForm(req.params.id, workspaceId);
  if (!copy)
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  res.status(201).json(copy);
};

export const deleteForm: RequestHandler = async (req, res) => {
  const form = await formService.deleteForm(req.params.id, workspaceIdOf(req));
  if (!form)
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  res.status(204).send();
};

export const listSubmissions: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form || form.workspaceId !== workspaceIdOf(req)) {
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  }
  const { page, limit, status, from, to, q } = req.query as Record<
    string,
    string | undefined
  >;

  const validIds = new Set(
    formService.flattenFieldsPublic(form.fields).map((f) => f.id),
  );
  const fieldFilters: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (!key.startsWith("f_") || typeof value !== "string") continue;
    const fieldId = key.slice(2);
    if (validIds.has(fieldId)) fieldFilters[fieldId] = value;
  }

  const result = await formService.listSubmissions(req.params.id, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    status: status as never,
    from,
    to,
    q,
    fieldFilters,
    currentFieldIds: [...validIds],
  });
  res.json(result);
};

export const updateSubmission: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form || form.workspaceId !== workspaceIdOf(req)) {
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  }
  const { read, starred } = req.body;
  const submission = await formService.updateSubmission(
    req.params.subId,
    req.params.id,
    {
      read,
      starred,
    },
  );
  if (!submission)
    return res
      .status(404)
      .json({ error: "not_found", message: "Submission not found" });
  res.json(submission);
};

const BULK_ACTION_LIMIT = 200;

function validateBulkIds(ids: unknown, res: Response): ids is string[] {
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    !ids.every((v) => typeof v === "string")
  ) {
    res
      .status(400)
      .json({
        error: "invalid_ids",
        message: "ids must be a non-empty array of strings",
      });
    return false;
  }
  if (ids.length > BULK_ACTION_LIMIT) {
    res.status(400).json({
      error: "too_many_ids",
      message: `At most ${BULK_ACTION_LIMIT} ids per request`,
    });
    return false;
  }
  return true;
}

export const bulkUpdateSubmissions: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form || form.workspaceId !== workspaceIdOf(req)) {
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  }
  const { ids, read, starred } = req.body ?? {};
  if (!validateBulkIds(ids, res)) return;
  if (read === undefined && starred === undefined) {
    return res
      .status(400)
      .json({ error: "no_patch", message: "read or starred must be provided" });
  }
  const { matchedCount } = await formService.bulkUpdateSubmissions(
    ids,
    req.params.id,
    { read, starred },
  );
  res.json({ matchedCount });
};

export const deleteSubmission: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form || form.workspaceId !== workspaceIdOf(req)) {
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  }
  const submission = await formService.deleteSubmission(
    req.params.subId,
    req.params.id,
  );
  if (!submission)
    return res
      .status(404)
      .json({ error: "not_found", message: "Submission not found" });
  res.status(204).send();
};

export const bulkDeleteSubmissions: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form || form.workspaceId !== workspaceIdOf(req)) {
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  }
  const ids = req.body?.ids;
  if (!validateBulkIds(ids, res)) return;
  const { deletedCount } = await formService.bulkDeleteSubmissions(
    ids,
    req.params.id,
  );
  res.json({ deletedCount });
};

/** Every file this form has collected, for a bulk download. */
export const listUploadedFiles: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form || form.workspaceId !== workspaceIdOf(req)) {
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  }
  res.json({
    files: await formService.uploadedFiles(req.params.id, form.fields),
  });
};

export const getAnalytics: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form || form.workspaceId !== workspaceIdOf(req)) {
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
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

export const getPublicForm: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form)
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });

  const doc = form.toObject();

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

  const availability = await formService.availability(form);

  const payField = paymentService.findPaymentField(fields ?? []);
  let needsPayerPhone = false;
  if (payField) {
    const defaultProvider = await paymentService.getWorkspaceDefaultProvider(
      form.workspaceId,
    );
    const provider = paymentService.resolveProvider(payField, defaultProvider);
    needsPayerPhone =
      paymentService.providerNeedsPhone(provider) &&
      !paymentService.formCollectsPhone(fields ?? []);
  }

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
    needsPayerPhone,

    branding: await getBranding(form.workspaceId),
  });
};

async function resolveEditToken(token: unknown, formId: string) {
  const read = readEditToken(token);
  if (!read.ok) return { error: read.reason } as const;

  const submission = await formService.getSubmissionById(read.submissionId);

  if (
    !submission ||
    String(submission.formId) !== formId ||
    submission.status !== "complete"
  ) {
    return { error: "invalid" } as const;
  }
  return { submission } as const;
}

export const getSubmissionForEdit: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form)
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  if (!form.allowEdit || !env.editTokenSecret) {
    return res
      .status(403)
      .json({
        error: "edit_disabled",
        message: "This form cannot be edited after sending",
      });
  }

  const found = await resolveEditToken(req.query.token, req.params.id);
  if ("error" in found) {
    return res.status(found.error === "expired" ? 410 : 403).json({
      error: found.error === "expired" ? "link_expired" : "invalid_link",
      message:
        found.error === "expired"
          ? "This edit link has expired."
          : "This edit link is not valid.",
    });
  }

  res.json({
    data: found.submission.data,
    fileMeta: found.submission.fileMeta,
  });
};

export const updateSubmissionByToken: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form)
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  if (!form.allowEdit || !env.editTokenSecret) {
    return res
      .status(403)
      .json({
        error: "edit_disabled",
        message: "This form cannot be edited after sending",
      });
  }

  const { _token, _fileMeta, ...data } = req.body;

  const found = await resolveEditToken(_token, req.params.id);
  if ("error" in found) {
    return res.status(found.error === "expired" ? 410 : 403).json({
      error: found.error === "expired" ? "link_expired" : "invalid_link",
      message:
        found.error === "expired"
          ? "This edit link has expired."
          : "This edit link is not valid.",
    });
  }

  if (paymentService.activePaymentField(form.fields, data)) {
    return res.status(409).json({
      error: "edit_unsupported",
      message: "Responses that include a payment cannot be edited.",
    });
  }

  let fileMeta: Record<string, { bytes: number }> | undefined;
  if (typeof _fileMeta === "string") {
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
      fileMeta,
    );
    if (!updated)
      return res
        .status(404)
        .json({ error: "not_found", message: "Response not found" });
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof formService.DuplicateValueError) {
      return res.status(409).json({
        error: "duplicate_value",
        message: err.message,
        fieldId: err.field.id,
      });
    }
    throw err;
  }
};

export const emailResumeLink: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form)
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  if (!form.collectPartials || !env.editTokenSecret || !env.publicFormBaseUrl) {
    return res.status(403).json({
      error: "resume_disabled",
      message: "This form cannot be saved for later.",
    });
  }

  const state = await formService.availability(form);
  if (!state.open) {
    return res
      .status(403)
      .json({ error: "form_closed", message: state.message });
  }

  const { _partialKey, email } = req.body;
  if (typeof _partialKey !== "string" || !_partialKey.trim()) {
    return res
      .status(400)
      .json({ error: "missing_key", message: "Nothing to save yet" });
  }

  if (
    typeof email !== "string" ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
  ) {
    return res
      .status(400)
      .json({ error: "invalid_email", message: "Enter a valid email address" });
  }

  const draft = await formService.getPartialByKey(req.params.id, _partialKey);
  if (!draft) {
    return res.status(404).json({
      error: "no_draft",
      message: "Fill in at least one answer before saving.",
    });
  }

  const link = `${env.publicFormBaseUrl}/form/${form._id}/view?resume=${mintResumeToken(
    String(draft._id),
  )}`;

  await sendResumeLink(form.workspaceId, email.trim(), form, link);
  res.status(204).send();
};

/** The answers behind a resume link, so the form reopens where it was left. */
export const getPartialForResume: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form)
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });

  const read = readEditToken(req.query.token, "resume");
  if (!read.ok) {
    return res.status(read.reason === "expired" ? 410 : 403).json({
      error: read.reason === "expired" ? "link_expired" : "invalid_link",
      message:
        read.reason === "expired"
          ? "This link has expired."
          : "This link is not valid.",
    });
  }

  const draft = await formService.getPartialById(read.submissionId);
  // A draft that has since been submitted or swept is gone rather than
  // forbidden, but both are told the same thing: there is nothing here now.
  if (!draft || String(draft.formId) !== req.params.id) {
    return res.status(410).json({
      error: "link_expired",
      message: "This draft is no longer available.",
    });
  }

  res.json({ data: draft.data, partialKey: draft.partialKey });
};

export const recordView: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form)
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  await formService.recordView(req.params.id, fingerprintOf(req));
  res.status(204).send();
};

export const savePartial: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form)
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });

  if (!form.collectPartials) return res.status(204).send();

  const state = await formService.availability(form);
  if (!state.open) return res.status(204).send();

  const { _partialKey, _lastFieldId, _lastFieldIndex, ...data } = req.body;
  if (typeof _partialKey !== "string" || !_partialKey.trim()) {
    return res
      .status(400)
      .json({ error: "missing_key", message: "No draft key" });
  }

  await formService.savePartial(
    req.params.id,
    _partialKey,
    data,
    typeof _lastFieldId === "string" ? _lastFieldId : undefined,
    typeof _lastFieldIndex === "number" ? _lastFieldIndex : undefined,
    req.get("referer"),
  );
  res.status(204).send();
};

export const submitForm: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form)
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });

  const state = await formService.availability(form);
  if (!state.open) {
    return res.status(403).json({
      error: state.reason === "notPublished" ? "not_published" : "form_closed",
      message: state.message,
    });
  }

  const {
    _hp,
    _retryOrderId: _ignoredRetry,
    _fileMeta,
    _captcha,
    _partialKey,
    _payerPhone: _ignoredPayerPhone,
    ...data
  } = req.body;
  if (_hp) {
    return res
      .status(400)
      .json({ error: "spam_detected", message: "Submission rejected" });
  }

  if (form.requireCaptcha && turnstileConfigured()) {
    const verdict = await verifyTurnstileToken(_captcha, req.ip);
    if (!verdict.ok && verdict.reason === "invalid") {
      return res.status(400).json({
        error: "captcha_failed",
        message: "Could not verify you are human. Please try again.",
      });
    }
  }

  let fileMeta: Record<string, { bytes: number }> | undefined;
  if (typeof _fileMeta === "string") {
    try {
      fileMeta = JSON.parse(_fileMeta);
    } catch {
      // Malformed input from a hand-edited request — the size badge is
      // cosmetic, so the submission still goes through without it.
    }
  }

  const limits = await getFormLimits(form.workspaceId);

  if (
    limits &&
    limits.submissionsUsed >=
      limits.monthlySubmissionQuota + limits.submissionCredits
  ) {
    return res.status(402).json({
      error: "submission_quota_reached",
      message:
        "This form is not accepting responses right now. Please try again later.",
    });
  }

  const sourceUrl = req.get("referer");

  const payField = paymentService.activePaymentField(form.fields, data);

  try {
    if (payField) {
      const amount = paymentService.resolveAmount(payField, data, form.fields);
      const currency = payField.pay?.currency ?? "INR";
      const defaultProvider = await paymentService.getWorkspaceDefaultProvider(
        form.workspaceId,
      );
      const provider = paymentService.resolveProvider(
        payField,
        defaultProvider,
      );
      const credentials = await paymentService.getCredentials(
        form.workspaceId,
        provider,
      );
      const customer = paymentService.findCustomerDetails(form.fields, data);

      if (paymentService.providerNeedsPhone(provider) && !customer.phone) {
        const supplied =
          typeof req.body._payerPhone === "string"
            ? paymentService.normalisePhone(req.body._payerPhone)
            : undefined;

        if (!supplied) {
          return res.status(422).json({
            error: "phone_required",
            message: "Enter a mobile number to continue to payment.",
            provider,
          });
        }
        customer.phone = supplied;
      }

      if (req.body._retryOrderId) {
        await formService.discardPendingSubmission(
          String(req.body._retryOrderId),
        );
      }

      const submission = await formService.submitForm(
        req.params.id,
        form.fields,
        data,
        sourceUrl,
        {
          provider,

          orderId: `pending_${Date.now()}`,
          amount,
          currency,
          status: "created",
        },
        fileMeta,
        typeof _partialKey === "string" ? _partialKey : undefined,
      );

      const order = await paymentService.createCheckout(credentials, {
        amount,
        currency,
        receipt: String(submission._id),
        notes: { formId: String(form._id), workspaceId: form.workspaceId },
        customerPhone: customer.phone,
        customerEmail: customer.email,
        customerName: customer.name,
        description: payField.pay?.description ?? form.title,

        returnUrl: paymentReturnUrl(req, form.workspaceId, provider),
      });

      await formService.attachOrderId(submission._id, order.orderId);

      const brand = await getBranding(form.workspaceId);

      return res.status(202).json({
        paymentRequired: true,
        brandName: brand.name,
        brandLogo: brand.logoUrl,
        brandAccent: brand.accentColor,
        provider,
        mode: credentials.mode,
        submissionId: submission._id,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: order.keyId,
        paymentSessionId: order.paymentSessionId,
        redirectUrl: order.redirectUrl,
        redirectFields: order.redirectFields,
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
      typeof _partialKey === "string" ? _partialKey : undefined,
    );
    res.status(201).json(submission);

    void recordSubmission(form.workspaceId);

    if (!limits || limits.notificationEmails) {
      void sendSubmissionNotifications(
        form,
        data,
        undefined,
        String(submission._id),
        String(form._id),
      );
    }
  } catch (err) {
    if (err instanceof formService.DuplicateValueError) {
      return res.status(409).json({
        error: "duplicate_value",
        message: err.message,
        fieldId: err.field.id,
      });
    }
    if (err instanceof paymentService.InvalidAmountError) {
      return res
        .status(400)
        .json({ error: "invalid_amount", message: err.message });
    }
    if (err instanceof paymentService.PaymentConfigError) {
      console.error("[payments] configuration problem:", err.message);
      return res.status(503).json({
        error: "payment_unavailable",
        message:
          "This form cannot take payments right now. Please try again later.",
      });
    }
    throw err;
  }
};

function paymentReturnUrl(
  req: Parameters<RequestHandler>[0],
  workspaceId: string,
  provider: PaymentProvider,
): string {
  const proto = req.get("x-forwarded-proto") ?? req.protocol;
  const host = req.get("x-forwarded-host") ?? req.get("host");
  return `${proto}://${host}/public/workspaces/${workspaceId}/payments/return/${provider}`;
}

async function applyPaymentEvent(
  workspaceId: string,
  provider: PaymentProvider,
  event: paymentService.WebhookEvent,
): Promise<"paid" | "failed" | "ignored" | "already" | "unknown"> {
  const { orderId, paymentId } = event;
  if (event.kind === "ignored" || !orderId) return "ignored";

  if (event.kind === "failed") {
    await formService.markSubmissionFailed(orderId);
    return "failed";
  }

  if (!paymentId) return "ignored";

  const pending = await formService.getSubmissionByOrderId(orderId);
  if (!pending) return "unknown";

  const form = await formService.getForm(String(pending.formId));

  if (!form || form.workspaceId !== workspaceId) {
    console.error(
      "[payments] order",
      orderId,
      "does not belong to workspace",
      workspaceId,
    );
    return "unknown";
  }

  const submission = await formService.markSubmissionPaid(orderId, paymentId, {
    payerEmail: event.payerEmail,
    payerContact: event.payerContact,
    method: event.method,
  });

  if (!submission) return "already";

  void workspaceSettingsService.markCharged(workspaceId, provider);
  void recordSubmission(workspaceId);
  const limits = await getFormLimits(workspaceId);
  if (!limits || limits.notificationEmails) {
    void sendSubmissionNotifications(form, submission.data, submission.payment);
  }
  return "paid";
}

const paymentWebhook =
  (provider: PaymentProvider): RequestHandler =>
  async (req, res) => {
    const { workspaceId } = req.params;

    const rawBody = req.body as Buffer;
    if (!Buffer.isBuffer(rawBody)) {
      console.error(
        "[payments] webhook body was parsed — raw parser is not mounted",
      );
      return res
        .status(500)
        .json({ error: "server_error", message: "Webhook misconfigured" });
    }

    let credentials;
    try {
      credentials = await paymentService.getCredentials(workspaceId, provider);
    } catch {
      return res
        .status(400)
        .json({ error: "not_configured", message: `No ${provider} account` });
    }

    if (!credentials.webhookSecret) {
      console.error(
        "[payments] no webhook secret saved for workspace",
        workspaceId,
        provider,
      );
      return res
        .status(400)
        .json({ error: "not_configured", message: "No webhook secret" });
    }

    const event = paymentService.parseWebhook(provider, {
      rawBody,
      headers: req.headers as Record<string, string | undefined>,
      secret: credentials.webhookSecret,
    });
    if (!event) {
      return res
        .status(401)
        .json({ error: "bad_signature", message: "Signature did not verify" });
    }

    const outcome = await applyPaymentEvent(workspaceId, provider, event);
    if (outcome === "ignored") {
      return res
        .status(200)
        .json({ ok: true, ignored: event.reason ?? "nothing to do" });
    }
    if (outcome === "unknown")
      return res.status(200).json({ ok: true, ignored: "unknown order" });
    if (outcome === "already")
      return res.status(200).json({ ok: true, alreadyHandled: true });

    res.status(200).json({ ok: true });
  };

export const razorpayWebhook = paymentWebhook("razorpay");
export const cashfreeWebhook = paymentWebhook("cashfree");
export const payuWebhook = paymentWebhook("payu");

export const payuReturn: RequestHandler = async (req, res) => {
  const { workspaceId } = req.params;

  const rawBody = req.body as Buffer;
  const posted = Buffer.isBuffer(rawBody)
    ? Object.fromEntries(new URLSearchParams(rawBody.toString("utf8")))
    : ((req.body ?? {}) as Record<string, string>);

  const params: Record<string, string | undefined> = {
    ...(req.query as Record<string, string>),
    ...posted,
  };

  const orderId = params.txnid;
  const submission = orderId
    ? await formService.getSubmissionByOrderId(orderId)
    : null;
  const formId = submission ? String(submission.formId) : undefined;

  let credentials;
  try {
    credentials = await paymentService.getCredentials(workspaceId, "payu");
  } catch {
    return res.redirect(303, respondentReturnUrl(formId, orderId, "error"));
  }

  const trusted = paymentService.parseWebhook("payu", {
    rawBody: Buffer.from(
      new URLSearchParams(params as Record<string, string>).toString(),
    ),
    headers: {},
    secret: credentials.webhookSecret ?? credentials.keySecret,
  });

  if (!trusted) {
    console.warn(
      "[payments] payu return failed its hash check for order",
      orderId,
    );
  }

  const verified = orderId
    ? await paymentService.verifyPayment(credentials, orderId)
    : null;
  const event = verified ?? trusted;

  if (!event) {
    return res.redirect(303, respondentReturnUrl(formId, orderId, "pending"));
  }

  const outcome = await applyPaymentEvent(workspaceId, "payu", event);
  const status =
    outcome === "paid" || outcome === "already"
      ? "paid"
      : outcome === "failed"
        ? "failed"
        : "pending";

  res.redirect(303, respondentReturnUrl(formId, orderId, status));
};

function respondentReturnUrl(
  formId: string | undefined,
  orderId: string | undefined,
  status: "paid" | "failed" | "pending" | "error",
): string {
  const base = env.publicFormBaseUrl;
  if (!base || !formId) {
    return `${base || ""}/`;
  }
  const query = new URLSearchParams({ payuStatus: status });
  if (orderId) query.set("payuOrder", orderId);
  return `${base}/form/${formId}/view?${query.toString()}`;
}

export const getPaymentStatus: RequestHandler = async (req, res) => {
  const submission = await formService.getSubmissionByOrderId(
    req.params.orderId,
  );
  if (!submission)
    return res
      .status(404)
      .json({ error: "not_found", message: "Unknown order" });
  res.json({
    status: submission.status,
    paymentStatus: submission.payment?.status ?? "created",
  });
};

export const generateForm: RequestHandler = async (req, res) => {
  const workspaceId = workspaceIdOf(req);
  const prompt =
    typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

  if (!prompt) {
    return res
      .status(400)
      .json({
        error: "prompt_required",
        message: "Describe the form you want.",
      });
  }

  const previous =
    req.body?.previous && typeof req.body.previous === "object"
      ? req.body.previous
      : undefined;

  const mode = req.body?.mode === "edit" ? "edit" : "create";

  const result = await quantalogGenerate(workspaceId, prompt, previous, mode);

  if (!result.ok) {
    return res.status(result.status).json({
      error: result.code ?? "generation_failed",
      message: result.error,
    });
  }

  res.json(result.form);
};

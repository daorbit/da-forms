import type { RequestHandler, Response } from "express";
import * as formService from "../../services/form.service.js";
import * as paymentService from "../../services/payment.service.js";
import { sendSubmissionNotifications, sendResumeLink } from "../../services/notification.service.js";
import { getFormLimits, recordSubmission, getBranding } from "../../lib/quantalog.js";
import { turnstileConfigured, verifyTurnstileToken } from "../../lib/turnstile.js";
import { deliverWebhook } from "../../services/webhook.service.js";
import { readEditToken, mintResumeToken } from "../../lib/edit-token.js";
import { env } from "../../config/env.js";
import { paymentReturnUrl } from "./payments.controller.js";
import { fingerprintOf } from "./shared.js";

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
    endings,
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
    endings,
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

    await Promise.allSettled([
      !limits || limits.notificationEmails
        ? sendSubmissionNotifications(
            form,
            data,
            undefined,
            String(submission._id),
            String(form._id),
          )
        : null,
      deliverWebhook(form, data, String(submission._id)),
      recordSubmission(form.workspaceId).catch((e: unknown) => {
        console.error("[submit] recordSubmission failed:", e instanceof Error ? e.message : e);
      }),
    ]);

    res.status(201).json(submission);
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

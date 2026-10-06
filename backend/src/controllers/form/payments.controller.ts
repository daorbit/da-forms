import type { RequestHandler } from "express";
import * as formService from "../../services/form.service.js";
import * as paymentService from "../../services/payment.service.js";
import type { PaymentProvider } from "../../models/workspaceSettings.model.js";
import * as workspaceSettingsService from "../../services/workspaceSettings.service.js";
import { sendSubmissionNotifications } from "../../services/notification.service.js";
import { getFormLimits, recordSubmission } from "../../lib/quantalog.js";
import { deliverWebhook } from "../../services/webhook.service.js";
import { env } from "../../config/env.js";

export function paymentReturnUrl(
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

  const limits = await getFormLimits(workspaceId);

  await Promise.allSettled([
    !limits || limits.notificationEmails
      ? sendSubmissionNotifications(form, submission.data, submission.payment)
      : null,
    deliverWebhook(form, submission.data, String(submission._id), submission.payment),
    workspaceSettingsService.markCharged(workspaceId, provider),
    recordSubmission(workspaceId),
  ]);

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

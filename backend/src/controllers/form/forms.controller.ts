import type { RequestHandler } from "express";
import * as formService from "../../services/form.service.js";
import { getFormLimits } from "../../lib/quantalog.js";
import { planLimit } from "../../lib/plan-limit.js";
import { workspaceIdOf } from "./shared.js";

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

export const exportFormConfig: RequestHandler = async (req, res) => {
  const config = await formService.exportFormConfig(
    req.params.id,
    workspaceIdOf(req),
  );
  if (!config)
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  res.json(config);
};

export const importFormConfig: RequestHandler = async (req, res) => {
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

  try {
    const form = await formService.importFormConfig(req.body?.config, workspaceId);
    res.status(201).json(form);
  } catch (err) {
    if (err instanceof formService.InvalidFormConfigError) {
      return res
        .status(400)
        .json({ error: "invalid_config", message: err.message });
    }
    throw err;
  }
};

export const deleteForm: RequestHandler = async (req, res) => {
  const form = await formService.deleteForm(req.params.id, workspaceIdOf(req));
  if (!form)
    return res
      .status(404)
      .json({ error: "not_found", message: "Form not found" });
  res.status(204).send();
};

import type { RequestHandler } from "express";
import { Types } from "mongoose";
import { analyticsRange, analyticsTimezone } from "../../lib/analyticsWindow.js";
import { formsAnalytics } from "../../services/formsAnalytics.service.js";
import { workspaceIdOf } from "./shared.js";

export const getFormsAnalytics: RequestHandler = async (req, res) => {
  const rawFormId = typeof req.query.formId === "string" ? req.query.formId : "";
  const formId = rawFormId && Types.ObjectId.isValid(rawFormId) ? rawFormId : null;
  if (rawFormId && !formId) return res.status(404).json({ error: "not_found" });

  const result = await formsAnalytics({
    workspaceId: workspaceIdOf(req),
    range: analyticsRange(req.query.range),
    timezone: analyticsTimezone(req.query.tz),
    formId,
  });
  if (!result) return res.status(404).json({ error: "not_found" });
  res.json(result);
};

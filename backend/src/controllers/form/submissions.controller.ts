import type { RequestHandler, Response } from "express";
import * as formService from "../../services/form.service.js";
import { loadOwnedForm } from "./shared.js";

export const listSubmissions: RequestHandler = async (req, res) => {
  const form = await loadOwnedForm(req, res);
  if (!form) return;
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
  const form = await loadOwnedForm(req, res);
  if (!form) return;
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
  const form = await loadOwnedForm(req, res);
  if (!form) return;
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
  const form = await loadOwnedForm(req, res);
  if (!form) return;
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
  const form = await loadOwnedForm(req, res);
  if (!form) return;
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
  const form = await loadOwnedForm(req, res);
  if (!form) return;
  res.json({
    files: await formService.uploadedFiles(req.params.id, form.fields),
  });
};

export const getAnalytics: RequestHandler = async (req, res) => {
  const form = await loadOwnedForm(req, res);
  if (!form) return;
  const [submissionCount, sources, dropOff] = await Promise.all([
    formService.submissionCount(req.params.id),
    formService.sourceBreakdown(req.params.id),
    // Empty for a form with autosave off — there is no record of where anyone
    // stopped, and an empty list says that more honestly than a zero would.
    formService.dropOffBreakdown(req.params.id),
  ]);
  const daily = await formService.dailyAnalytics(req.params.id, sources[0]?.source ?? null, 14);
  const viewCount = form.viewCount ?? 0;
  const completionRate = viewCount > 0 ? submissionCount / viewCount : 0;
  res.json({
    viewCount,
    submissionCount,
    completionRate,
    sources,
    dropOff,
    // Per-day views, responses, top-source responses and abandons for the last
    // 14 days — the stat cards' trends and week-on-week changes.
    daily,
    // So the page can tell "nobody abandoned this form" from "we were never
    // watching", which are the same empty list otherwise.
    partialsEnabled: Boolean(form.collectPartials),
  });
};

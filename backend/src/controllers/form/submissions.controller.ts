import type { RequestHandler, Response } from "express";
import * as formService from "../../services/form.service.js";
import * as pipelineService from "../../services/pipeline.service.js";
import * as importService from "../../services/submission-import.service.js";
import { formLeadSources, workspaceLeadSources } from "../../services/leadSources.service.js";
import { loadOwnedForm, workspaceIdOf } from "./shared.js";
import { audit, formTarget } from "../../lib/audit.js";

const SORTS = ["newest", "oldest", "score"] as const;

export const listSubmissions: RequestHandler = async (req, res) => {
  const form = await loadOwnedForm(req, res);
  if (!form) return;
  const { page, limit, status, from, to, q, stage, assignee, tag, minScore, sort } =
    req.query as Record<string, string | undefined>;

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
    stage: pipelineService.isStage(stage) ? stage : undefined,
    assignee: assignee?.trim().slice(0, 80) || undefined,
    tag: tag?.trim().slice(0, 40) || undefined,
    minScore: minScore !== undefined && minScore !== "" ? Number(minScore) : undefined,
    sort: SORTS.find((s) => s === sort),
  });
  res.json(result);
};

export const updateSubmission: RequestHandler = async (req, res) => {
  const form = await loadOwnedForm(req, res);
  if (!form) return;
  const { read, starred } = req.body ?? {};
  const submission = await formService.updateSubmission(
    req.params.subId,
    req.params.id,
    {
      ...(typeof read === "boolean" ? { read } : {}),
      ...(typeof starred === "boolean" ? { starred } : {}),
      ...pipelineService.readPipelinePatch(req.body ?? {}),
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
  const { stage, assignee } = pipelineService.readPipelinePatch(req.body ?? {});
  const patch = {
    ...(typeof read === "boolean" ? { read } : {}),
    ...(typeof starred === "boolean" ? { starred } : {}),
    ...(stage ? { stage } : {}),
    ...(assignee !== undefined ? { assignee } : {}),
  };
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({
      error: "no_patch",
      message: "read, starred, stage or assignee must be provided",
    });
  }
  const { matchedCount } = await formService.bulkUpdateSubmissions(
    ids,
    req.params.id,
    patch,
  );
  res.json({ matchedCount });
};

export const importSubmissions: RequestHandler = async (req, res) => {
  const form = await loadOwnedForm(req, res);
  if (!form) return;
  const rows = req.body?.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "no_rows", message: "The file has no rows to import" });
  }
  if (rows.length > importService.IMPORT_ROW_LIMIT) {
    return res.status(400).json({
      error: "too_many_rows",
      message: `Import at most ${importService.IMPORT_ROW_LIMIT} rows at a time`,
    });
  }
  const result = await importService.importSubmissions(
    req.params.id,
    form.fields,
    rows,
    importService.cleanTags(req.body?.tags),
  );
  if (result.imported) {
    await audit(req, res, "form.submissions_imported", formTarget(form), { count: result.imported });
  }
  res.status(201).json(result);
};

export const addSubmissionNote: RequestHandler = async (req, res) => {
  const form = await loadOwnedForm(req, res);
  if (!form) return;
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) {
    return res.status(400).json({ error: "empty_note", message: "Write something first" });
  }
  const submission = await pipelineService.addNote(req.params.subId, req.params.id, text);
  if (!submission)
    return res
      .status(404)
      .json({ error: "not_found", message: "Submission not found" });
  res.status(201).json(submission);
};

export const deleteSubmissionNote: RequestHandler = async (req, res) => {
  const form = await loadOwnedForm(req, res);
  if (!form) return;
  const submission = await pipelineService.removeNote(
    req.params.subId,
    req.params.id,
    req.params.noteId,
  );
  if (!submission)
    return res
      .status(404)
      .json({ error: "not_found", message: "Submission not found" });
  res.json(submission);
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
  await audit(req, res, "form.submission_deleted", formTarget(form), { submissionId: req.params.subId });
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
  if (deletedCount) {
    await audit(req, res, "form.submissions_deleted", formTarget(form), { count: deletedCount });
  }
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
    formLeadSources(req.params.id),
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

const LEAD_SOURCE_RANGES: Record<string, number> = { "30d": 30, "90d": 90, "365d": 365 };

export const getLeadSources: RequestHandler = async (req, res) => {
  const range = typeof req.query.range === "string" ? req.query.range : "90d";
  const days = LEAD_SOURCE_RANGES[range];
  const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined;
  res.json(await workspaceLeadSources(workspaceIdOf(req), since));
};

import type { RequestHandler } from 'express';
import * as formService from '../services/form.service.js';

/** Every workspace-scoped route carries the id in the path. */
function workspaceIdOf(req: { params: Record<string, string> }) {
  return req.params.workspaceId;
}

export const listForms: RequestHandler = async (req, res) => {
  const { page, limit, q, sort } = req.query as Record<string, string | undefined>;
  const result = await formService.listForms(workspaceIdOf(req), {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    q,
    sort: sort as never,
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
    title,
    description,
    fields,
    redirectUrl,
    thankYouMessage,
    hideHeader,
    labelPlacement,
    submitLabel,
    submitButtonSize,
    submitButtonWidth,
    theme,
    collectIp,
  } = req.body;
  const form = await formService.createForm({
    title,
    description,
    fields: fields ?? [],
    redirectUrl,
    thankYouMessage,
    hideHeader,
    labelPlacement,
    submitLabel,
    submitButtonSize,
    submitButtonWidth,
    theme,
    collectIp,
    workspaceId: workspaceIdOf(req),
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
  await formService.recordView(req.params.id);
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

  const sourceUrl = req.get('referer');
  try {
    const submission = await formService.submitForm(req.params.id, form.fields, data, sourceUrl);
    res.status(201).json(submission);
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

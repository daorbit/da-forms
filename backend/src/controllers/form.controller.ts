import type { RequestHandler } from 'express';
import * as formService from '../services/form.service.js';

/** Every workspace-scoped route carries the id in the path. */
function workspaceIdOf(req: { params: Record<string, string> }) {
  return req.params.workspaceId;
}

export const listForms: RequestHandler = async (req, res) => {
  const forms = await formService.listForms(workspaceIdOf(req));
  res.json(forms);
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
  const submissions = await formService.listSubmissions(req.params.id);
  res.json(submissions);
};

/* ---- Public routes: no workspace in the path ---- */

/** The form as respondents see it. Reachable by id alone — that is the share link. */
export const getPublicForm: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  res.json(form);
};

export const submitForm: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  const sourceUrl = req.get('referer');
  const submission = await formService.submitForm(req.params.id, req.body, sourceUrl);
  res.status(201).json(submission);
};

import type { RequestHandler } from 'express';
import * as formService from '../services/form.service.js';

export const listForms: RequestHandler = async (req, res) => {
  const projectKey = String(req.query.projectKey ?? 'default');
  const forms = await formService.listForms(projectKey);
  res.json(forms);
};

export const getForm: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  res.json(form);
};

export const createForm: RequestHandler = async (req, res) => {
  const { title, description, fields, redirectUrl, projectKey } = req.body;
  const form = await formService.createForm({
    title,
    description,
    fields: fields ?? [],
    redirectUrl,
    projectKey: projectKey ?? 'default',
  });
  res.status(201).json(form);
};

export const updateForm: RequestHandler = async (req, res) => {
  const form = await formService.updateForm(req.params.id, req.body);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  res.json(form);
};

export const deleteForm: RequestHandler = async (req, res) => {
  const form = await formService.deleteForm(req.params.id);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  res.status(204).send();
};

export const submitForm: RequestHandler = async (req, res) => {
  const form = await formService.getForm(req.params.id);
  if (!form) return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  const sourceUrl = req.get('referer');
  const submission = await formService.submitForm(req.params.id, req.body, sourceUrl);
  res.status(201).json(submission);
};

export const listSubmissions: RequestHandler = async (req, res) => {
  const submissions = await formService.listSubmissions(req.params.id);
  res.json(submissions);
};

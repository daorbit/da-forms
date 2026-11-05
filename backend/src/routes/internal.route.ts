import { Router } from 'express';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireBearerSecret } from '../middleware/require-bearer-secret.js';
import { purgeWorkspace } from '../services/workspace-purge.service.js';
import { leadContacts, leadSources } from '../services/campaignLeads.service.js';
import { emailStatus, sendEmailBatch } from '../services/campaignMail.service.js';

export const internalRouter = Router();

internalRouter.use(requireBearerSecret(() => env.formsServiceSecret, 'FORMS_SERVICE_SECRET'));

internalRouter.delete(
  '/workspaces/:workspaceId',
  asyncHandler(async (req, res) => {
    const result = await purgeWorkspace(String(req.params.workspaceId));
    res.json({ ok: true, ...result });
  })
);

internalRouter.get(
  '/workspaces/:workspaceId/leads/sources',
  asyncHandler(async (req, res) => {
    res.json({ forms: await leadSources(String(req.params.workspaceId)) });
  })
);

internalRouter.post(
  '/workspaces/:workspaceId/leads/contacts',
  asyncHandler(async (req, res) => {
    res.json({ contacts: await leadContacts(String(req.params.workspaceId), req.body?.formIds) });
  })
);

internalRouter.get(
  '/workspaces/:workspaceId/email/status',
  asyncHandler(async (req, res) => {
    res.json(await emailStatus(String(req.params.workspaceId)));
  })
);

internalRouter.post(
  '/workspaces/:workspaceId/email/batch',
  asyncHandler(async (req, res) => {
    res.json({ results: await sendEmailBatch(String(req.params.workspaceId), req.body) });
  })
);

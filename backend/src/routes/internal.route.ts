import { Router } from 'express';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireBearerSecret } from '../middleware/require-bearer-secret.js';
import { purgeWorkspace } from '../services/workspace-purge.service.js';

export const internalRouter = Router();

internalRouter.use(requireBearerSecret(() => env.formsServiceSecret, 'FORMS_SERVICE_SECRET'));

internalRouter.delete(
  '/workspaces/:workspaceId',
  asyncHandler(async (req, res) => {
    const result = await purgeWorkspace(String(req.params.workspaceId));
    res.json({ ok: true, ...result });
  })
);

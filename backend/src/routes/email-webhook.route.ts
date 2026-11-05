import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import { handleResendWebhook } from '../services/emailWebhook.service.js';

export const publicEmailRouter = Router();

publicEmailRouter.post(
  '/:workspaceId/email/webhook/resend',
  asyncHandler(async (req, res) => {
    const outcome = await handleResendWebhook(
      String(req.params.workspaceId),
      Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '',
      {
        id: req.get('svix-id') ?? '',
        timestamp: req.get('svix-timestamp') ?? '',
        signature: req.get('svix-signature') ?? '',
      }
    );
    res.status(outcome === 'rejected' ? 401 : 204).end();
  })
);

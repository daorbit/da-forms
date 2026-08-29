import type { RequestHandler } from 'express';
import { verifyWorkspaceToken, isTokenAuthConfigured } from '../lib/workspace-token.js';
import { isDemoWorkspace } from './demo-workspace.js';

/**
 * Guards routes where the workspace id alone must not be enough.
 *
 * Everything about a form is already reachable by id — that is what a share
 * link is. Payment credentials are different: an attacker who knows a
 * workspace id and can write its settings redirects every payment that
 * workspace takes into their own Razorpay account, and the owner sees nothing
 * but submissions that never pay out. So these routes want proof the caller
 * holds a Quantalog session for this workspace, not just knowledge of its id.
 *
 * The token rides in `Authorization: Bearer`, or as `?wt=` for the initial
 * iframe navigation where a header cannot be set.
 */
export const requireWorkspaceToken: RequestHandler = (req, res, next) => {
  // The showcase workspace holds no credentials and cannot be written to, so
  // there is nothing here to protect — and a visitor with no Quantalog session
  // is exactly who is meant to be looking at it.
  if (isDemoWorkspace(req.params.workspaceId)) return next();

  // Fails closed. A settings route that hands out or overwrites payment
  // credentials is not one to leave open because an env var was forgotten —
  // the same call `forms-internal` makes on the Quantalog side.
  if (!isTokenAuthConfigured()) {
    console.error('[workspace-token] FORMS_SERVICE_SECRET is not set — refusing');
    return res.status(503).json({
      error: 'not_configured',
      message: 'Workspace verification is not configured on this server.',
    });
  }

  const header = req.get('authorization') ?? '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : typeof req.query.wt === 'string'
      ? req.query.wt
      : '';

  if (!token) {
    return res.status(401).json({
      error: 'workspace_token_required',
      message: 'Open this from your Quantalog workspace.',
    });
  }

  const result = verifyWorkspaceToken(token, req.params.workspaceId);
  if (!result.ok) {
    // Expiry is worth telling apart from the rest: it is the one failure a
    // legitimate user hits, by leaving a tab open, and the fix is to reload
    // rather than to worry.
    const expired = result.reason === 'expired';
    return res.status(401).json({
      error: expired ? 'workspace_token_expired' : 'workspace_token_invalid',
      message: expired
        ? 'This session has expired — reload the page to continue.'
        : 'Open this from your Quantalog workspace.',
    });
  }

  next();
};

import type { Request, RequestHandler, Response } from 'express';
import * as sheetsService from '../services/sheetsConnection.service.js';
import type { ConnectFailure } from '../services/calendarConnection.service.js';
import { renderOAuthPopup } from '../lib/oauthPopup.js';
import { recordAuditEvent } from '../lib/quantalog.js';
import type { OAuthState } from '../lib/oauthState.js';
import { audit } from '../lib/audit.js';

const SHEETS_TARGET = { kind: 'app', id: 'google-sheets', label: 'Google Sheets' };

const FAILURE_TEXT: Record<ConnectFailure, string> = {
  invalid_state: 'That connection attempt expired. Close this window and start again.',
  denied: 'You cancelled the Google authorisation.',
  missing_code: 'Google did not return an authorisation code. Please try again.',
  scope_declined:
    'Google Sheets access was not granted. Tick the permission to create spreadsheets on Google’s consent screen, or responses cannot be added.',
  no_refresh_token:
    'Google did not finish granting long-term access. Please try again, and contact support if it keeps happening.',
  google_failed: 'Google could not complete the connection. Please try again.',
};

export const getSheets: RequestHandler = async (req, res) => {
  res.json(await sheetsService.sheetsStatus(req.params.workspaceId));
};

export const getSheetsConnectUrl: RequestHandler = async (req, res) => {
  if (!sheetsService.sheetsAvailable()) {
    return res.status(503).json({
      error: 'sheets_not_configured',
      message: 'Google Sheets is not set up on this server yet.',
    });
  }
  const actorId = typeof res.locals.actorId === 'string' ? res.locals.actorId : undefined;
  res.json({ url: sheetsService.sheetsConnectUrl(req.params.workspaceId, actorId) });
};

export const disconnectSheets: RequestHandler = async (req, res) => {
  await sheetsService.disconnectSheets(req.params.workspaceId);
  void audit(req, res, 'form.app_disconnected', SHEETS_TARGET);
  res.json(await sheetsService.sheetsStatus(req.params.workspaceId));
};

export async function sheetsCallback(req: Request, res: Response, state: OAuthState): Promise<void> {
  const result = req.query.error
    ? { ok: false as const, reason: (req.query.error === 'access_denied' ? 'denied' : 'google_failed') as ConnectFailure }
    : await sheetsService.completeSheetsConnection(state, req.query.code);

  if (!result.ok) {
    return renderOAuthPopup(res, {
      source: 'forms-google-sheets',
      ok: false,
      reason: result.reason,
      title: 'Could not connect Google Sheets',
      message: FAILURE_TEXT[result.reason],
    });
  }

  void recordAuditEvent(state.workspaceId, {
    action: 'form.app_connected',
    actorId: state.actorId,
    target: SHEETS_TARGET,
    ip: (req.ip ?? '').replace(/^::ffff:/, ''),
    userAgent: req.get('user-agent') ?? '',
  });

  renderOAuthPopup(res, {
    source: 'forms-google-sheets',
    ok: true,
    title: 'Google Sheets connected',
    message: 'You can close this window.',
  });
}

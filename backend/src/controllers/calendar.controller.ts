import type { RequestHandler } from 'express';
import * as calendarService from '../services/calendarConnection.service.js';
import { renderOAuthPopup } from '../lib/oauthPopup.js';
import { recordAuditEvent } from '../lib/quantalog.js';
import { readOAuthState } from '../lib/oauthState.js';
import { audit } from '../lib/audit.js';

const CALENDAR_TARGET = { kind: 'app', id: 'google-calendar', label: 'Google Calendar' };

const FAILURE_TEXT: Record<calendarService.ConnectFailure, string> = {
  invalid_state: 'That connection attempt expired. Close this window and start again.',
  denied: 'You cancelled the Google authorisation.',
  missing_code: 'Google did not return an authorisation code. Please try again.',
  scope_declined:
    'Calendar access was not granted. Tick every calendar permission on Google’s consent screen, or the booking field cannot check your busy times and add events.',
  no_refresh_token:
    'Google did not return a long-lived token. Remove this app from your Google account permissions and try again.',
  google_failed: 'Google could not complete the connection. Please try again.',
};

export const getCalendar: RequestHandler = async (req, res) => {
  res.json(await calendarService.calendarStatus(req.params.workspaceId));
};

export const getCalendarConnectUrl: RequestHandler = async (req, res) => {
  if (!calendarService.calendarAvailable()) {
    return res.status(503).json({
      error: 'calendar_not_configured',
      message: 'Google Calendar is not set up on this server yet.',
    });
  }
  const actorId = typeof res.locals.actorId === 'string' ? res.locals.actorId : undefined;
  res.json({ url: calendarService.connectUrl(req.params.workspaceId, actorId) });
};

export const disconnectCalendar: RequestHandler = async (req, res) => {
  await calendarService.disconnectCalendar(req.params.workspaceId);
  void audit(req, res, 'form.app_disconnected', CALENDAR_TARGET);
  res.json(await calendarService.calendarStatus(req.params.workspaceId));
};

export const calendarCallback: RequestHandler = async (req, res) => {
  const result = await calendarService.completeConnection(req.query);

  if (!result.ok) {
    return renderOAuthPopup(res, {
      source: 'forms-google-calendar',
      ok: false,
      reason: result.reason,
      title: 'Could not connect Google Calendar',
      message: FAILURE_TEXT[result.reason],
    });
  }

  const state = readOAuthState(req.query.state);
  if (state) {
    void recordAuditEvent(state.workspaceId, {
      action: 'form.app_connected',
      actorId: state.actorId,
      target: CALENDAR_TARGET,
      ip: (req.ip ?? '').replace(/^::ffff:/, ''),
      userAgent: req.get('user-agent') ?? '',
    });
  }

  renderOAuthPopup(res, {
    source: 'forms-google-calendar',
    ok: true,
    title: 'Google Calendar connected',
    message: 'You can close this window.',
  });
};

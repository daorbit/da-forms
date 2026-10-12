import { CalendarConnectionModel } from '../models/calendarConnection.model.js';
import { decrypt, encrypt, isEncryptionConfigured } from '../lib/crypto.js';
import {
  GoogleApiError,
  buildAuthorizeUrl,
  exchangeCode,
  fetchGoogleEmail,
  googleCalendarConfigured,
  hasCalendarScopes,
  refreshTokens,
  revokeToken,
} from '../lib/googleOAuth.js';
import { listCalendars, type CalendarSummary } from '../lib/googleCalendar.js';
import { readOAuthState, signOAuthState } from '../lib/oauthState.js';

export type ConnectFailure =
  | 'invalid_state'
  | 'denied'
  | 'missing_code'
  | 'scope_declined'
  | 'no_refresh_token'
  | 'google_failed';

export interface CalendarStatus {
  configured: boolean;
  connected: boolean;
  status?: 'active' | 'revoked';
  email?: string;
  calendars: CalendarSummary[];
}

export function calendarAvailable(): boolean {
  return googleCalendarConfigured() && isEncryptionConfigured();
}

export function connectUrl(workspaceId: string, actorId?: string): string {
  return buildAuthorizeUrl(signOAuthState({ workspaceId, actorId }));
}

export async function completeConnection(query: {
  code?: unknown;
  state?: unknown;
  error?: unknown;
}): Promise<{ ok: true } | { ok: false; reason: ConnectFailure }> {
  if (query.error) return { ok: false, reason: query.error === 'access_denied' ? 'denied' : 'google_failed' };

  const state = readOAuthState(query.state);
  if (!state) return { ok: false, reason: 'invalid_state' };
  if (typeof query.code !== 'string' || !query.code) return { ok: false, reason: 'missing_code' };

  let tokens;
  try {
    tokens = await exchangeCode(query.code);
  } catch (err) {
    console.error('[google-calendar] code exchange failed:', err instanceof Error ? err.message : err);
    return { ok: false, reason: 'google_failed' };
  }

  if (tokens.scope && !hasCalendarScopes(tokens.scope)) {
    await revokeToken(tokens.accessToken);
    return { ok: false, reason: 'scope_declined' };
  }
  if (!tokens.refreshToken) {
    await revokeToken(tokens.accessToken);
    return { ok: false, reason: 'no_refresh_token' };
  }

  const email = await fetchGoogleEmail(tokens.accessToken);

  await CalendarConnectionModel.findOneAndUpdate(
    { workspaceId: state.workspaceId },
    {
      workspaceId: state.workspaceId,
      connectedBy: state.actorId,
      googleEmail: email,
      accessTokenEnc: encrypt(tokens.accessToken),
      refreshTokenEnc: encrypt(tokens.refreshToken),
      expiresAt: tokens.expiresAt,
      scope: tokens.scope,
      status: 'active',
    },
    { upsert: true }
  );

  return { ok: true };
}

export async function calendarAccessToken(workspaceId: string): Promise<string | null> {
  const connection = await CalendarConnectionModel.findOne({ workspaceId, status: 'active' }).select(
    '+accessTokenEnc +refreshTokenEnc expiresAt'
  );
  if (!connection) return null;

  if (connection.expiresAt.getTime() > Date.now()) {
    try {
      return decrypt(connection.accessTokenEnc);
    } catch {
      return null;
    }
  }

  try {
    const tokens = await refreshTokens(decrypt(connection.refreshTokenEnc));
    await CalendarConnectionModel.updateOne(
      { _id: connection._id },
      {
        accessTokenEnc: encrypt(tokens.accessToken),
        expiresAt: tokens.expiresAt,
        ...(tokens.refreshToken ? { refreshTokenEnc: encrypt(tokens.refreshToken) } : {}),
      }
    );
    return tokens.accessToken;
  } catch (err) {
    if (err instanceof GoogleApiError && err.kind === 'revoked') {
      await CalendarConnectionModel.updateOne({ _id: connection._id }, { status: 'revoked' });
    }
    console.error('[google-calendar] token refresh failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function calendarStatus(workspaceId: string): Promise<CalendarStatus> {
  const configured = calendarAvailable();
  if (!configured) return { configured, connected: false, calendars: [] };

  const connection = await CalendarConnectionModel.findOne({ workspaceId })
    .select('googleEmail status')
    .lean();
  if (!connection) return { configured, connected: false, calendars: [] };

  const token = connection.status === 'active' ? await calendarAccessToken(workspaceId) : null;
  const calendars = token ? await listCalendars(token).catch(() => []) : [];

  return {
    configured,
    connected: Boolean(token),
    status: token ? 'active' : 'revoked',
    email: connection.googleEmail,
    calendars,
  };
}

export async function disconnectCalendar(workspaceId: string): Promise<void> {
  const connection = await CalendarConnectionModel.findOne({ workspaceId }).select('+refreshTokenEnc');
  if (!connection) return;
  try {
    await revokeToken(decrypt(connection.refreshTokenEnc));
  } catch {
    console.warn('[google-calendar] stored refresh token could not be decrypted for revoke');
  }
  await CalendarConnectionModel.deleteOne({ _id: connection._id });
}

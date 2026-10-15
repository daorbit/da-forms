import { env } from '../config/env.js';

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const TIMEOUT_MS = 10_000;

export const CALENDAR_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
export const CALENDAR_LIST_SCOPE = 'https://www.googleapis.com/auth/calendar.calendarlist.readonly';
export const CALENDAR_FREEBUSY_SCOPE = 'https://www.googleapis.com/auth/calendar.events.freebusy';
const LEGACY_CALENDAR_READ_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const SCOPES = ['openid', 'email', CALENDAR_EVENTS_SCOPE, CALENDAR_LIST_SCOPE, CALENDAR_FREEBUSY_SCOPE].join(' ');
export const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const SHEETS_SCOPES = ['openid', 'email', DRIVE_FILE_SCOPE].join(' ');

export type GoogleErrorKind = 'revoked' | 'quota' | 'forbidden' | 'not_found' | 'unavailable' | 'unknown';

export class GoogleApiError extends Error {
  constructor(
    public kind: GoogleErrorKind,
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope: string;
}

export function googleCalendarConfigured(): boolean {
  return Boolean(env.googleCalendarClientId && env.googleCalendarClientSecret && env.googleCalendarRedirectUri);
}

export function hasCalendarScopes(scope: string): boolean {
  const granted = new Set(scope.split(/\s+/));
  const canRead =
    granted.has(LEGACY_CALENDAR_READ_SCOPE) || (granted.has(CALENDAR_LIST_SCOPE) && granted.has(CALENDAR_FREEBUSY_SCOPE));
  return granted.has(CALENDAR_EVENTS_SCOPE) && canRead;
}

export function hasSheetsScope(scope: string): boolean {
  return scope.split(/\s+/).includes(DRIVE_FILE_SCOPE);
}

export function buildAuthorizeUrl(state: string, scopes: string = SCOPES): string {
  const params = new URLSearchParams({
    client_id: env.googleCalendarClientId,
    redirect_uri: env.googleCalendarRedirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

function errorKind(status: number, body: string): GoogleErrorKind {
  if (status === 401 || /invalid_grant|invalid_client/.test(body)) return 'revoked';
  if (status === 429 || /RATE_LIMIT|QUOTA/i.test(body)) return 'quota';
  if (status === 403) return 'forbidden';
  if (status === 404 || status === 410) return 'not_found';
  if (status >= 500 || status === 0) return 'unavailable';
  return 'unknown';
}

export async function googleFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    throw new GoogleApiError('unavailable', 503, err instanceof Error ? err.message : 'Google unreachable');
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new GoogleApiError(errorKind(res.status, body), res.status, body.slice(0, 300) || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function googleApi<T>(url: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  return googleFetch<T>(url, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  });
}

function tokensFrom(data: {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}): GoogleTokens {
  const lifetime = Number(data.expires_in ?? 3600);
  return {
    accessToken: String(data.access_token ?? ''),
    refreshToken: data.refresh_token ? String(data.refresh_token) : undefined,
    expiresAt: new Date(Date.now() + Math.max(lifetime - 60, 60) * 1000),
    scope: String(data.scope ?? ''),
  };
}

function tokenRequest(params: Record<string, string>) {
  return googleFetch<Parameters<typeof tokensFrom>[0]>(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.googleCalendarClientId,
      client_secret: env.googleCalendarClientSecret,
      ...params,
    }),
  });
}

export async function exchangeCode(code: string): Promise<GoogleTokens> {
  const tokens = tokensFrom(
    await tokenRequest({ code, redirect_uri: env.googleCalendarRedirectUri, grant_type: 'authorization_code' })
  );
  if (!tokens.accessToken) throw new GoogleApiError('unknown', 502, 'Google returned no access token');
  return tokens;
}

export async function refreshTokens(refreshToken: string): Promise<GoogleTokens> {
  return tokensFrom(await tokenRequest({ refresh_token: refreshToken, grant_type: 'refresh_token' }));
}

export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(REVOKE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    console.warn('[google-calendar] revoke failed:', err instanceof Error ? err.message : err);
  }
}

export async function fetchGoogleEmail(accessToken: string): Promise<string> {
  try {
    const data = await googleApi<{ email?: string }>(USERINFO_URL, accessToken);
    return data.email ?? '';
  } catch {
    return '';
  }
}

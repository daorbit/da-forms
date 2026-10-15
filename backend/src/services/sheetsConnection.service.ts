import { SheetsConnectionModel } from '../models/sheetsConnection.model.js';
import { FormSheetModel } from '../models/formSheet.model.js';
import { FormModel } from '../models/form.model.js';
import { decrypt, encrypt, isEncryptionConfigured } from '../lib/crypto.js';
import {
  GoogleApiError,
  SHEETS_SCOPES,
  buildAuthorizeUrl,
  exchangeCode,
  fetchGoogleEmail,
  googleCalendarConfigured,
  hasSheetsScope,
  refreshTokens,
  revokeToken,
} from '../lib/googleOAuth.js';
import { signOAuthState, type OAuthState } from '../lib/oauthState.js';
import type { ConnectFailure } from './calendarConnection.service.js';

const SHEET_LIST_LIMIT = 100;

export interface LinkedSheet {
  formId: string;
  formTitle: string;
  spreadsheetUrl: string;
  rows: number;
  lastRowAt?: Date;
  createdAt: Date;
}

export interface SheetsStatus {
  configured: boolean;
  connected: boolean;
  status?: 'active' | 'revoked';
  email?: string;
  lastUsedAt?: Date;
  lastError?: string;
  sheets: LinkedSheet[];
}

export function sheetsAvailable(): boolean {
  return googleCalendarConfigured() && isEncryptionConfigured();
}

export function sheetsConnectUrl(workspaceId: string, actorId?: string): string {
  return buildAuthorizeUrl(signOAuthState({ workspaceId, actorId, kind: 'sheets' }), SHEETS_SCOPES);
}

export async function completeSheetsConnection(
  state: OAuthState,
  code: unknown
): Promise<{ ok: true } | { ok: false; reason: ConnectFailure }> {
  if (typeof code !== 'string' || !code) return { ok: false, reason: 'missing_code' };

  let tokens;
  try {
    tokens = await exchangeCode(code);
  } catch (err) {
    console.error('[google-sheets] code exchange failed:', err instanceof Error ? err.message : err);
    return { ok: false, reason: 'google_failed' };
  }

  if (tokens.scope && !hasSheetsScope(tokens.scope)) {
    await revokeToken(tokens.accessToken);
    return { ok: false, reason: 'scope_declined' };
  }
  if (!tokens.refreshToken) {
    await revokeToken(tokens.accessToken);
    return { ok: false, reason: 'no_refresh_token' };
  }

  const email = await fetchGoogleEmail(tokens.accessToken);
  const previous = await SheetsConnectionModel.findOne({ workspaceId: state.workspaceId }).select('googleEmail').lean();

  await SheetsConnectionModel.findOneAndUpdate(
    { workspaceId: state.workspaceId },
    {
      $set: {
        workspaceId: state.workspaceId,
        connectedBy: state.actorId,
        googleEmail: email,
        accessTokenEnc: encrypt(tokens.accessToken),
        refreshTokenEnc: encrypt(tokens.refreshToken),
        expiresAt: tokens.expiresAt,
        scope: tokens.scope,
        status: 'active',
      },
      $unset: { lastError: 1 },
    },
    { upsert: true }
  );

  if (previous && previous.googleEmail !== email) {
    await FormSheetModel.deleteMany({ workspaceId: state.workspaceId });
  }

  return { ok: true };
}

export async function sheetsAccessToken(workspaceId: string): Promise<string | null> {
  const connection = await SheetsConnectionModel.findOne({ workspaceId, status: 'active' }).select(
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
    await SheetsConnectionModel.updateOne(
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
      await SheetsConnectionModel.updateOne(
        { _id: connection._id },
        { $set: { status: 'revoked' }, $unset: { accessTokenEnc: 1, refreshTokenEnc: 1 } }
      );
    }
    console.error('[google-sheets] token refresh failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function markSheetsResult(workspaceId: string, error?: string): Promise<void> {
  await SheetsConnectionModel.updateOne(
    { workspaceId },
    error ? { $set: { lastError: error.slice(0, 300) } } : { $set: { lastUsedAt: new Date() }, $unset: { lastError: 1 } }
  ).catch(() => undefined);
}

async function linkedSheets(workspaceId: string): Promise<LinkedSheet[]> {
  const links = await FormSheetModel.find({ workspaceId })
    .sort({ updatedAt: -1 })
    .limit(SHEET_LIST_LIMIT)
    .select('formId spreadsheetUrl rows lastRowAt createdAt')
    .lean();
  if (!links.length) return [];

  const forms = await FormModel.find({ _id: { $in: links.map((l) => l.formId) }, workspaceId })
    .select('title')
    .lean();
  const titles = new Map(forms.map((f) => [String(f._id), f.title]));

  return links
    .filter((link) => titles.has(link.formId))
    .map((link) => ({
      formId: link.formId,
      formTitle: titles.get(link.formId) ?? 'Untitled form',
      spreadsheetUrl: link.spreadsheetUrl,
      rows: link.rows,
      lastRowAt: link.lastRowAt,
      createdAt: link.createdAt,
    }));
}

export async function sheetsStatus(workspaceId: string): Promise<SheetsStatus> {
  const configured = sheetsAvailable();
  if (!configured) return { configured, connected: false, sheets: [] };

  const connection = await SheetsConnectionModel.findOne({ workspaceId })
    .select('googleEmail status lastUsedAt lastError')
    .lean();
  if (!connection) return { configured, connected: false, sheets: [] };

  const [token, sheets] = await Promise.all([
    connection.status === 'active' ? sheetsAccessToken(workspaceId) : Promise.resolve(null),
    linkedSheets(workspaceId),
  ]);

  return {
    configured,
    connected: Boolean(token),
    status: token ? 'active' : 'revoked',
    email: connection.googleEmail,
    lastUsedAt: connection.lastUsedAt,
    lastError: connection.lastError,
    sheets,
  };
}

export async function disconnectSheets(workspaceId: string): Promise<void> {
  const connection = await SheetsConnectionModel.findOne({ workspaceId }).select('+refreshTokenEnc');
  if (connection?.refreshTokenEnc) {
    try {
      await revokeToken(decrypt(connection.refreshTokenEnc));
    } catch {
      console.warn('[google-sheets] stored refresh token could not be decrypted for revoke');
    }
  }
  await Promise.all([
    SheetsConnectionModel.deleteOne({ workspaceId }),
    FormSheetModel.deleteMany({ workspaceId }),
  ]);
}

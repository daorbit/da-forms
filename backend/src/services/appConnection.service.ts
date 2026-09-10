import { AppConnectionModel, type AppId } from '../models/appConnection.model.js';
import {
  APP_CATALOG,
  EMAIL_APP_IDS,
  getDescriptor,
  type AppDescriptor,
  type AppField,
} from '../lib/app-catalog.js';
import { encrypt, decrypt, maskTail, isEncryptionConfigured } from '../lib/crypto.js';
import { invalidateMailCache } from '../lib/mailer.js';

/**
 * The read model for one app card.
 *
 * The descriptor's static half (name, description, fields) plus this
 * workspace's connection state. Secrets are never here — `secrets` carries a
 * masked tail so the form can show which key is saved without handing it back.
 */
export interface AppCardView {
  id: AppId;
  name: string;
  category: string;
  description: string;
  docsUrl?: string;
  testable: boolean;
  fields: AppField[];
  connected: boolean;
  enabled: boolean;
  verifiedAt?: Date;
  lastUsedAt?: Date;
  /** Plain config values as stored. */
  config: Record<string, unknown>;
  /** One `••••1234` per saved secret field. */
  secrets: Record<string, string>;
}

export class ConfigInvalidError extends Error {}
export class UnknownAppError extends Error {}

/** A stored connection, or a bare unconnected shell, projected onto its descriptor. */
function toCard(
  descriptor: AppDescriptor,
  doc: {
    enabled?: boolean;
    config?: Record<string, unknown>;
    secrets?: Record<string, string>;
    verifiedAt?: Date;
    lastUsedAt?: Date;
  } | null
): AppCardView {
  const secretMasks: Record<string, string> = {};
  if (doc?.secrets) {
    for (const field of descriptor.fields) {
      if (!field.secret) continue;
      const enc = doc.secrets[field.key];
      if (enc) {
        try {
          secretMasks[field.key] = maskTail(decrypt(enc));
        } catch {
          // A value that will not decrypt (wrong key, tampered) is reported as
          // present-but-unreadable rather than crashing the whole listing.
          secretMasks[field.key] = '••••';
        }
      }
    }
  }

  return {
    id: descriptor.id,
    name: descriptor.name,
    category: descriptor.category,
    description: descriptor.description,
    docsUrl: descriptor.docsUrl,
    testable: descriptor.testable,
    fields: descriptor.fields,
    connected: Boolean(doc),
    enabled: Boolean(doc?.enabled),
    verifiedAt: doc?.verifiedAt,
    lastUsedAt: doc?.lastUsedAt,
    config: doc?.config ?? {},
    secrets: secretMasks,
  };
}

/** Every catalog app with this workspace's connection state folded in. */
export async function listApps(workspaceId: string): Promise<AppCardView[]> {
  const docs = await AppConnectionModel.find({ workspaceId });
  const byId = new Map(docs.map((d) => [d.appId, d]));
  return APP_CATALOG.map((descriptor) => toCard(descriptor, byId.get(descriptor.id) ?? null));
}

export async function getApp(workspaceId: string, appId: string): Promise<AppCardView> {
  const descriptor = getDescriptor(appId);
  if (!descriptor) throw new UnknownAppError(`Unknown app: ${appId}`);
  const doc = await AppConnectionModel.findOne({ workspaceId, appId });
  return toCard(descriptor, doc);
}

/** Coerce one incoming value to its field's type, or throw with the field label. */
function coerce(field: AppField, raw: unknown): unknown {
  if (field.type === 'number') {
    const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
    if (!Number.isFinite(n)) throw new ConfigInvalidError(`${field.label} must be a number.`);
    return n;
  }
  if (field.type === 'boolean') {
    return raw === true || raw === 'true' || raw === 1 || raw === '1';
  }
  const s = String(raw ?? '').trim();
  if (field.type === 'email' && s && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)) {
    throw new ConfigInvalidError(`${field.label} is not a valid email address.`);
  }
  return s;
}

export interface SaveAppInput {
  /** Field key → value. Omitted secret keys keep whatever is stored. */
  values?: Record<string, unknown>;
  enabled?: boolean;
}

/**
 * Create or update a workspace's connection to one app.
 *
 * Plain fields are replaced wholesale from `values`. Secret fields are only
 * touched when a non-empty value is supplied — an omitted or blank secret key
 * leaves the stored ciphertext alone, so re-saving the from-address does not
 * wipe the API key. Any secret that does change clears `verifiedAt`: the last
 * successful test was against different credentials.
 *
 * For the email category only one app is live at a time. Enabling one disables
 * the other, so the mailer never has to choose between two.
 */
export async function saveApp(
  workspaceId: string,
  appId: string,
  input: SaveAppInput
): Promise<AppCardView> {
  const descriptor = getDescriptor(appId);
  if (!descriptor) throw new UnknownAppError(`Unknown app: ${appId}`);

  const existing = await AppConnectionModel.findOne({ workspaceId, appId });
  const values = input.values ?? {};

  const config: Record<string, unknown> = { ...(existing?.config ?? {}) };
  const secrets: Record<string, string> = { ...(existing?.secrets ?? {}) };
  let secretChanged = false;

  for (const field of descriptor.fields) {
    const supplied = Object.prototype.hasOwnProperty.call(values, field.key);

    if (field.secret) {
      const raw = supplied ? String(values[field.key] ?? '').trim() : '';
      if (raw) {
        secrets[field.key] = encrypt(raw);
        secretChanged = true;
      }
      continue;
    }

    if (supplied) {
      config[field.key] = coerce(field, values[field.key]);
    } else if (field.default !== undefined && config[field.key] === undefined) {
      config[field.key] = field.default;
    }
  }

  // Required-field check runs against the merged result, so it passes on a
  // second save that only sends the changed fields.
  for (const field of descriptor.fields) {
    if (!field.required) continue;
    const present = field.secret
      ? Boolean(secrets[field.key])
      : config[field.key] !== undefined && config[field.key] !== '';
    if (!present) throw new ConfigInvalidError(`${field.label} is required.`);
  }

  const willEnable = input.enabled ?? existing?.enabled ?? false;

  const doc = await AppConnectionModel.findOneAndUpdate(
    { workspaceId, appId },
    {
      $set: {
        config,
        secrets,
        enabled: willEnable,
        ...(secretChanged ? { verifiedAt: null } : {}),
      },
      $setOnInsert: { workspaceId, appId },
    },
    { upsert: true, new: true }
  );

  // One live email app. If this one is on, the siblings go off.
  if (willEnable && EMAIL_APP_IDS.includes(appId as AppId)) {
    await AppConnectionModel.updateMany(
      { workspaceId, appId: { $in: EMAIL_APP_IDS, $ne: appId }, enabled: true },
      { $set: { enabled: false } }
    );
  }

  invalidateMailCache(workspaceId);
  return toCard(descriptor, doc);
}

export async function disconnectApp(workspaceId: string, appId: string): Promise<AppCardView[]> {
  const descriptor = getDescriptor(appId);
  if (!descriptor) throw new UnknownAppError(`Unknown app: ${appId}`);
  await AppConnectionModel.deleteOne({ workspaceId, appId });
  invalidateMailCache(workspaceId);
  return listApps(workspaceId);
}

/** The decrypted, ready-to-use view of one connection. Internal to the mailer. */
export interface ResolvedConnection {
  appId: AppId;
  config: Record<string, unknown>;
  secrets: Record<string, string>;
}

/** Decrypt one stored connection's secrets, or null if any is missing/unreadable. */
function decryptConnection(
  doc: { appId: string; config?: Record<string, unknown>; secrets?: Record<string, string> } | null
): ResolvedConnection | null {
  if (!doc) return null;
  const descriptor = getDescriptor(doc.appId);
  if (!descriptor) return null;

  const secrets: Record<string, string> = {};
  for (const field of descriptor.fields) {
    if (!field.secret) continue;
    const enc = doc.secrets?.[field.key];
    if (!enc) return null;
    try {
      secrets[field.key] = decrypt(enc);
    } catch {
      return null;
    }
  }

  return { appId: descriptor.id, config: doc.config ?? {}, secrets };
}

/** The workspace's active email connection with secrets decrypted, or null. */
export async function resolveEmailConnection(
  workspaceId: string
): Promise<ResolvedConnection | null> {
  const doc = await AppConnectionModel.findOne({
    workspaceId,
    appId: { $in: EMAIL_APP_IDS },
    enabled: true,
  });
  return decryptConnection(doc);
}

/**
 * One named connection with secrets decrypted, regardless of its enabled state.
 *
 * For the test action: an owner checks a provider before switching to it, so
 * the connection being tested is usually the one that is still off.
 */
export async function resolveConnection(
  workspaceId: string,
  appId: string
): Promise<ResolvedConnection | null> {
  const doc = await AppConnectionModel.findOne({ workspaceId, appId });
  return decryptConnection(doc);
}

/** Fire-and-forget: record that a real message went out through this app. */
export async function markUsed(workspaceId: string, appId: AppId): Promise<void> {
  try {
    await AppConnectionModel.updateOne(
      { workspaceId, appId },
      { $set: { lastUsedAt: new Date() } }
    );
  } catch (err) {
    console.error('[apps] could not record use of', appId, err);
  }
}

/** Mark the active email connection verified, after a test send succeeded. */
export async function markVerified(workspaceId: string, appId: string): Promise<void> {
  await AppConnectionModel.updateOne(
    { workspaceId, appId },
    { $set: { verifiedAt: new Date() } }
  );
}

export interface TestResult {
  ok: boolean;
  message: string;
}

/**
 * Prove a saved connection works.
 *
 * Two levels, chosen by whether `to` is given:
 *
 *  - No address — a credentials check. `transporter.verify()` opens the
 *    connection and runs the AUTH handshake without sending anything, so a bad
 *    host, port, username, password or Brevo SMTP key fails with the server's
 *    own words. This is the default, since it needs nothing from the user.
 *  - An address — the full end-to-end send, which additionally exercises the
 *    From header (a provider can authenticate a login yet refuse to send as an
 *    unverified sender).
 *
 * Either success stamps `verifiedAt`. The connection does not have to be the
 * enabled one, so an owner can check a new provider before switching.
 */
export async function testApp(
  workspaceId: string,
  appId: string,
  to?: string
): Promise<TestResult> {
  const descriptor = getDescriptor(appId);
  if (!descriptor) throw new UnknownAppError(`Unknown app: ${appId}`);

  if (descriptor.category !== 'email') {
    return { ok: false, message: 'This app has no test action.' };
  }

  const recipient = to?.trim();
  if (recipient && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)) {
    return { ok: false, message: 'Enter a valid address to send the test to.' };
  }

  const { verifyConnection, sendTestEmail } = await import('../lib/mailer.js');
  try {
    if (recipient) {
      await sendTestEmail(workspaceId, appId as AppId, recipient);
    } else {
      await verifyConnection(workspaceId, appId as AppId);
    }
    await markVerified(workspaceId, appId);
    return {
      ok: true,
      message: recipient
        ? `Test email sent to ${recipient}.`
        : 'Connection verified — credentials are good.',
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'The provider rejected the connection.',
    };
  }
}

export { isEncryptionConfigured };

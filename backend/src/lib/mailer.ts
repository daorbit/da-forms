import nodemailer, { type Transporter } from 'nodemailer';
import {
  resolveEmailConnection,
  resolveConnection,
  markUsed,
  type ResolvedConnection,
} from '../services/appConnection.service.js';
import type { AppId } from '../models/appConnection.model.js';

/**
 * Outbound mail, sent through whatever email app the workspace has connected.
 *
 * There is no server-wide fallback transport any more: a workspace that has not
 * connected Custom SMTP or Brevo sends nothing, and `mailConfigured` says so
 * before a caller builds a message it cannot deliver.
 *
 * Transports are built per workspace and cached briefly — a form being filled
 * in repeatedly must not mean a settings lookup and a fresh connection pool per
 * response.
 */

interface CachedTransport {
  transporter: Transporter;
  from: string;
  appId: ResolvedConnection['appId'];
  at: number;
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CachedTransport>();

/** Drop a workspace's cached transport, so the next send picks up new settings. */
export function invalidateMailCache(workspaceId: string): void {
  cache.get(workspaceId)?.transporter.close();
  cache.delete(workspaceId);
}

function fromHeader(conn: ResolvedConnection): string {
  const name = String(conn.config.fromName ?? '').trim();
  const email = String(conn.config.fromEmail ?? '').trim();
  if (!email) return '';
  return name ? `"${name}" <${email}>` : email;
}

/** A nodemailer transport for one resolved connection. */
function buildTransport(conn: ResolvedConnection): Transporter {
  if (conn.appId === 'brevo') {
    // Brevo's SMTP relay — no extra dependency. The username is the account's
    // own login email and the password is a dedicated SMTP key (not a REST API
    // key); Brevo rejects the connection if the pair does not match.
    return nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: { user: String(conn.config.loginEmail ?? ''), pass: conn.secrets.smtpKey },
      pool: true,
      maxConnections: 1,
      maxMessages: 50,
    });
  }

  // Custom SMTP.
  const port = Number(conn.config.port) || 587;
  return nodemailer.createTransport({
    host: String(conn.config.host ?? ''),
    port,
    // Explicit setting wins; otherwise 465 is implicit TLS and 587 is STARTTLS.
    secure: conn.config.secure === true || (conn.config.secure === undefined && port === 465),
    auth: { user: String(conn.config.user ?? ''), pass: conn.secrets.pass },
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
  });
}

async function getCached(workspaceId: string): Promise<CachedTransport | null> {
  const hit = cache.get(workspaceId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit;

  const conn = await resolveEmailConnection(workspaceId);
  if (!conn) {
    if (hit) invalidateMailCache(workspaceId);
    return null;
  }

  if (hit) hit.transporter.close();
  const entry: CachedTransport = {
    transporter: buildTransport(conn),
    from: fromHeader(conn),
    appId: conn.appId,
    at: Date.now(),
  };
  cache.set(workspaceId, entry);
  return entry;
}

/** Whether this workspace has a usable email connection. */
export async function mailConfigured(workspaceId: string): Promise<boolean> {
  return (await getCached(workspaceId)) !== null;
}

/**
 * Send one message on behalf of a workspace.
 *
 * Throws if the workspace has no email app connected — callers that treat mail
 * as best-effort check `mailConfigured` first; the one caller that is answering
 * a button (the resume link) lets the throw surface.
 */
export async function sendMail(
  workspaceId: string,
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
  const entry = await getCached(workspaceId);
  if (!entry) throw new Error(`No email app connected for workspace ${workspaceId}`);

  await entry.transporter.sendMail({ from: entry.from, to, subject, html, text });
  void markUsed(workspaceId, entry.appId);
}

/**
 * Prove a saved connection's credentials without sending anything.
 *
 * `transporter.verify()` opens the connection and runs the AUTH handshake, so a
 * wrong host, port, username or password (or Brevo SMTP key) fails here with the
 * server's own message. It does not check that the From address is one the
 * provider will accept — only `sendTestEmail` proves that end to end.
 *
 * Builds a throwaway transport for exactly the app under test rather than
 * touching the workspace cache: the connection may not be the enabled one, and
 * a failing check must not evict a working transport.
 */
export async function verifyConnection(workspaceId: string, appId: AppId): Promise<void> {
  const conn = await resolveConnection(workspaceId, appId);
  if (!conn) throw new Error('Save the connection details first.');

  const transporter = buildTransport(conn);
  try {
    await transporter.verify();
  } finally {
    transporter.close();
  }
}

/**
 * Send a fixed message through one connection, live or not.
 *
 * The end-to-end proof: unlike `verifyConnection` this also exercises the From
 * address, since a provider can authenticate a login yet refuse to send as an
 * unverified sender. Throws on any transport or auth error so the caller can
 * show the provider's own words.
 */
export async function sendTestEmail(
  workspaceId: string,
  appId: AppId,
  to: string
): Promise<void> {
  const conn = await resolveConnection(workspaceId, appId);
  if (!conn) {
    throw new Error('Save the connection details before sending a test.');
  }

  const from = fromHeader(conn);
  if (!from) throw new Error('Set a from name and address before sending a test.');

  const transporter = buildTransport(conn);
  try {
    await transporter.sendMail({
      from,
      to,
      subject: 'Test email from your form notifications',
      html: '<p>This connection works. Notification emails will be sent through it.</p>',
      text: 'This connection works. Notification emails will be sent through it.',
    });
  } finally {
    transporter.close();
  }
}

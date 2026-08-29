import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

/**
 * Proof that a caller really is acting for a workspace.
 *
 * Workspace ids are not secrets. They sit in iframe URLs, browser history and
 * referrer headers, and anyone who has seen one could otherwise read or
 * overwrite that workspace's settings just by putting it in a path. That is
 * survivable for a form definition; it is not survivable for Razorpay
 * credentials, where an attacker who swaps the keys quietly redirects every
 * payment the workspace takes.
 *
 * So the id alone is not enough. Quantalog owns the session, and mints a short
 * lived token saying "this browser may act for this workspace". This verifies
 * it — no session store, no extra round trip, just the shared secret both
 * services already hold.
 *
 * Deliberately not a full JWT: there are no claims to negotiate and no third
 * party to interoperate with. Two fields and an HMAC are easier to reason about
 * than a library that also accepts `alg: none`.
 */

/** How long a freshly minted token stays usable. Quantalog re-mints as needed. */
export const TOKEN_TTL_SECONDS = 60 * 60;

/**
 * Small allowance for clocks that disagree between the two services, so a
 * token minted a second ago is not rejected as being from the future.
 */
const CLOCK_SKEW_SECONDS = 60;

export function isTokenAuthConfigured(): boolean {
  return Boolean(env.formsServiceSecret);
}

/** `workspaceId.expiresAt.signature` — one opaque string for the URL. */
export function signWorkspaceToken(workspaceId: string, ttlSeconds = TOKEN_TTL_SECONDS): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${workspaceId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function sign(payload: string): string {
  return createHmac('sha256', env.formsServiceSecret).update(payload).digest('base64url');
}

export type TokenFailure = 'malformed' | 'bad_signature' | 'expired' | 'wrong_workspace';

export interface TokenResult {
  ok: boolean;
  reason?: TokenFailure;
}

/**
 * Whether `token` really authorises acting for `workspaceId`.
 *
 * The workspace is checked against the token's own claim rather than trusted
 * from the path: a valid token for workspace A must not open workspace B.
 */
export function verifyWorkspaceToken(token: string, workspaceId: string): TokenResult {
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };

  const [claimedWorkspace, expiresAtRaw, signature] = parts;
  const expected = sign(`${claimedWorkspace}.${expiresAtRaw}`);

  // Constant time, so a mismatch leaks nothing about how far it matched.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'bad_signature' };
  }

  // Only after the signature holds: an unsigned payload's contents mean
  // nothing, and reading them first would be reading attacker input.
  if (claimedWorkspace !== workspaceId) return { ok: false, reason: 'wrong_workspace' };

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) return { ok: false, reason: 'malformed' };
  if (expiresAt + CLOCK_SKEW_SECONDS < Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true };
}

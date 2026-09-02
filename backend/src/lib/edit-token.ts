import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

/**
 * The credential that lets a respondent reopen their own submission.
 *
 * Derived rather than stored: the token is an HMAC over the submission's id, so
 * verifying one is a recomputation rather than a lookup, and there is no table
 * of live edit links to leak, expire, or clean up. It also means a submission
 * deleted by the owner takes its edit link with it — the id stops resolving and
 * the token becomes a signature over nothing.
 *
 * Signed with the app's own secret, so a respondent cannot mint a token for
 * someone else's submission by editing the one they were sent. The id alone is
 * not enough: Mongo ids are sequential enough to guess neighbours from, which
 * is exactly the walk this prevents.
 */

/** Included in the signature so a token cannot be replayed past its window. */
type Payload = { id: string; exp: number };

function sign(payload: string): string {
  return createHmac('sha256', env.editTokenSecret).update(payload).digest('base64url');
}

/**
 * A token for one submission, valid for `editWindowDays`.
 *
 * The expiry rides inside the signed payload rather than being checked against
 * the submission's own timestamps, so shortening the window later applies to
 * links already sent instead of only to new ones.
 */
export function mintEditToken(submissionId: string): string {
  const exp = Date.now() + env.editWindowDays * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ id: submissionId, exp })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export type EditTokenResult =
  | { ok: true; submissionId: string }
  /** Malformed, or signed with something other than our secret. */
  | { ok: false; reason: 'invalid' }
  /** Genuine, but past its window. Told apart so the page can say so. */
  | { ok: false; reason: 'expired' };

/**
 * Recover the submission id a token was minted for.
 *
 * The signature is checked before the payload is trusted for anything, and
 * compared in constant time — a token is a credential, and a comparison that
 * returns early leaks how much of a guess was right.
 */
export function readEditToken(token: unknown): EditTokenResult {
  if (typeof token !== 'string' || !token.includes('.')) return { ok: false, reason: 'invalid' };

  const [payload, provided] = token.split('.');
  if (!payload || !provided) return { ok: false, reason: 'invalid' };

  const expected = sign(payload);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: 'invalid' };

  let parsed: Payload;
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    // Signed by us but unreadable — a deploy that changed the payload shape,
    // not an attack. Refused either way.
    return { ok: false, reason: 'invalid' };
  }

  if (typeof parsed.id !== 'string' || typeof parsed.exp !== 'number') {
    return { ok: false, reason: 'invalid' };
  }
  if (Date.now() > parsed.exp) return { ok: false, reason: 'expired' };

  return { ok: true, submissionId: parsed.id };
}

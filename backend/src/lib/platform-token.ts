import { createPublicKey, verify, type KeyObject } from 'node:crypto';

const ISSUER = 'da-super-admin';
const MAX_LIFETIME_SECONDS = 90;
const CLOCK_TOLERANCE_SECONDS = 30;
const MAX_REMEMBERED = 5_000;

export type PlatformAdmin = { id: string; email: string; scopes: string[] };

export type PlatformTokenResult =
  | { ok: true; admin: PlatformAdmin }
  | { ok: false; status: number; error: string };

const seen = new Map<string, number>();
let keyCache: { source: string; keys: Map<string, KeyObject> } | null = null;

function toPem(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith('-----BEGIN') ? trimmed : Buffer.from(trimmed, 'base64').toString('utf8');
}

function publicKeys(): Map<string, KeyObject> {
  const source = process.env.PLATFORM_PUBLIC_KEYS ?? '';
  if (keyCache?.source === source) return keyCache.keys;
  const keys = new Map<string, KeyObject>();
  if (source) {
    for (const [kid, pem] of Object.entries(JSON.parse(source) as Record<string, unknown>)) {
      if (typeof pem === 'string') keys.set(kid, createPublicKey(toPem(pem)));
    }
  }
  keyCache = { source, keys };
  return keys;
}

function decodeJson(segment: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function firstUse(jti: string, expiresAtMs: number): boolean {
  const now = Date.now();
  if (seen.size > MAX_REMEMBERED) for (const [key, until] of seen) if (until <= now) seen.delete(key);
  if (seen.has(jti)) return false;
  seen.set(jti, expiresAtMs);
  return true;
}

const invalid = { ok: false, status: 401, error: 'platform_invalid' } as const;

export function readPlatformToken(header: string | undefined, audience: string, scopes: string[]): PlatformTokenResult {
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return { ok: false, status: 401, error: 'platform_missing' };
  const keys = publicKeys();
  if (!keys.size) return { ok: false, status: 503, error: 'platform_not_configured' };

  const parts = token.split('.');
  if (parts.length !== 3) return invalid;
  const [rawHeader, rawPayload, rawSignature] = parts as [string, string, string];
  const jwsHeader = decodeJson(rawHeader);
  const key = typeof jwsHeader?.kid === 'string' ? keys.get(jwsHeader.kid) : undefined;
  if (!jwsHeader || jwsHeader.alg !== 'ES256' || !key) return invalid;

  const signed = verify('sha256', Buffer.from(`${rawHeader}.${rawPayload}`), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(rawSignature, 'base64url'));
  const payload = signed ? decodeJson(rawPayload) : null;
  if (!payload) return invalid;

  const { iss, aud, sub, email, scopes: granted, jti, iat, exp } = payload;
  const audienceOk = aud === audience || (Array.isArray(aud) && aud.includes(audience));
  if (iss !== ISSUER || !audienceOk || typeof sub !== 'string' || typeof jti !== 'string') return invalid;
  if (typeof iat !== 'number' || typeof exp !== 'number' || !Array.isArray(granted)) return invalid;

  const now = Math.floor(Date.now() / 1000);
  if (exp - iat > MAX_LIFETIME_SECONDS || iat > now + CLOCK_TOLERANCE_SECONDS) return invalid;
  if (exp + CLOCK_TOLERANCE_SECONDS < now) return { ok: false, status: 401, error: 'platform_expired' };
  if (!scopes.every((scope) => granted.includes(scope))) return { ok: false, status: 403, error: 'platform_forbidden' };
  if (!firstUse(jti, (exp + CLOCK_TOLERANCE_SECONDS) * 1000)) return { ok: false, status: 401, error: 'platform_replayed' };

  return { ok: true, admin: { id: sub, email: typeof email === 'string' ? email : '', scopes: granted.map(String) } };
}
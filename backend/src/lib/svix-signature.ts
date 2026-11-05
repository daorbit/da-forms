import { createHmac, timingSafeEqual } from 'node:crypto';

const TOLERANCE_SECONDS = 5 * 60;
const SECRET_PREFIX = 'whsec_';

export interface SvixHeaders {
  id: string;
  timestamp: string;
  signature: string;
}

export function verifySvixSignature(secret: string, headers: SvixHeaders, rawBody: string, nowMs = Date.now()): boolean {
  if (!secret || !headers.id || !headers.timestamp || !headers.signature) return false;

  const sentAt = Number(headers.timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(nowMs / 1000 - sentAt) > TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.startsWith(SECRET_PREFIX) ? secret.slice(SECRET_PREFIX.length) : secret, 'base64');
  const expected = createHmac('sha256', key).update(`${headers.id}.${headers.timestamp}.${rawBody}`).digest();

  return headers.signature.split(' ').some((entry) => {
    const [version, value] = entry.split(',');
    if (version !== 'v1' || !value) return false;
    const provided = Buffer.from(value, 'base64');
    return provided.length === expected.length && timingSafeEqual(provided, expected);
  });
}

import { createHmac, randomInt } from 'node:crypto';
import { env } from '../config/env.js';

const TTL_MS = 5 * 60 * 1000;

export interface CaptchaChallenge {
  question: string;
  token: string;
}

function sign(payload: string) {
  return createHmac('sha256', env.captchaSecret).update(payload).digest('hex');
}

/**
 * A signed, stateless math challenge — the answer and expiry ride inside the
 * token itself (HMAC-verified), so there is nothing to store server-side.
 * That matters here specifically because the API runs serverless: no shared
 * memory between invocations to hold a session.
 */
export function generateCaptcha(): CaptchaChallenge {
  const a = randomInt(1, 10);
  const b = randomInt(1, 10);
  const answer = a + b;
  const expires = Date.now() + TTL_MS;
  const payload = `${answer}.${expires}`;
  const token = `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
  return { question: `${a} + ${b}`, token };
}

export function verifyCaptcha(token: string | undefined, answer: string | number | undefined): boolean {
  if (!token || answer === undefined || answer === null || answer === '') return false;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return false;

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
  } catch {
    return false;
  }
  if (sign(payload) !== signature) return false;

  const [expectedAnswer, expiresStr] = payload.split('.');
  if (Date.now() > Number(expiresStr)) return false;
  return String(answer).trim() === expectedAnswer;
}

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

const STATE_TTL_SECONDS = 10 * 60;

export type OAuthKind = 'calendar' | 'sheets';

export interface OAuthState {
  workspaceId: string;
  actorId?: string;
  kind?: OAuthKind;
}

function sign(payload: string): string {
  return createHmac('sha256', `${env.formsServiceSecret}:oauth-state`).update(payload).digest('base64url');
}

export function signOAuthState(state: OAuthState): string {
  const payload = Buffer.from(
    JSON.stringify({
      w: state.workspaceId,
      a: state.actorId ?? '',
      k: state.kind ?? 'calendar',
      e: Math.floor(Date.now() / 1000) + STATE_TTL_SECONDS,
      n: randomBytes(8).toString('hex'),
    })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function readOAuthState(raw: unknown): OAuthState | null {
  if (typeof raw !== 'string' || !env.formsServiceSecret) return null;
  const [payload, signature] = raw.split('.');
  if (!payload || !signature) return null;

  const a = Buffer.from(signature);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      w?: string;
      a?: string;
      k?: string;
      e?: number;
    };
    if (!data.w || !data.e || data.e < Math.floor(Date.now() / 1000)) return null;
    return {
      workspaceId: data.w,
      actorId: data.a || undefined,
      kind: data.k === 'sheets' ? 'sheets' : 'calendar',
    };
  } catch {
    return null;
  }
}

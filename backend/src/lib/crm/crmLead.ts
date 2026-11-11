export interface CrmLead {
  firstName?: string;
  lastName: string;
  email?: string;
  phone?: string;
  company: string;
  description: string;
  title: string;
}

export class CrmError extends Error {}

const REQUEST_TIMEOUT_MS = 10_000;

export async function crmFetch(url: string, init: RequestInit) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, body };
}

export function errorText(body: Record<string, unknown>, status: number): string {
  const message = body.message ?? body.error ?? (body.errors as unknown[] | undefined)?.[0];
  if (typeof message === 'string' && message.trim()) return message.trim().slice(0, 300);
  if (message && typeof message === 'object' && typeof (message as { message?: unknown }).message === 'string') {
    return String((message as { message: string }).message).slice(0, 300);
  }
  return `HTTP ${status}`;
}

export function fullName(lead: CrmLead): string {
  return [lead.firstName, lead.lastName].filter(Boolean).join(' ');
}

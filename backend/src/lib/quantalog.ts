import { env } from '../config/env.js';

/**
 * What a workspace's Quantalog plan allows lead capture to do.
 *
 * Plans and billing live in Quantalog, not here — this service stores forms and
 * responses, but it has no opinion about what a customer has paid for. Asking
 * is what keeps the two from disagreeing.
 */
export interface FormLimits {
  plan: string;
  /** Display name of the plan, for anything shown to a customer. */
  planName?: string;
  maxForms: number;
  monthlySubmissionQuota: number;
  submissionsUsed: number;
  /** Responses bought on top of the cycle's allowance. These never expire. */
  submissionCredits: number;
  notificationEmails: boolean;
  fileUploads: boolean;
}

/** How long a workspace's limits are reused before asking again. */
const CACHE_TTL_MS = 60_000;

const cache = new Map<string, { at: number; limits: FormLimits }>();

export function isConfigured(): boolean {
  return Boolean(env.quantalogApiUrl && env.formsServiceSecret);
}

/**
 * This workspace's limits, or null if Quantalog could not answer.
 *
 * Null is not "no allowance" — it is "unknown", and each caller decides what to
 * do with that. A public submission accepts anyway; creating a form does not.
 * The distinction matters: an outage should cost us one over-quota row, never a
 * real lead that someone's visitor already took the trouble to type.
 *
 * Cached briefly per workspace, so a form being filled in repeatedly does not
 * mean a round trip per response.
 */
export async function getFormLimits(workspaceId: string): Promise<FormLimits | null> {
  if (!isConfigured()) return null;

  const hit = cache.get(workspaceId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.limits;

  try {
    const res = await fetch(
      `${env.quantalogApiUrl}/api/internal/forms/limits/${encodeURIComponent(workspaceId)}`,
      {
        headers: { authorization: `Bearer ${env.formsServiceSecret}` },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) {
      console.error(`[quantalog] limits lookup failed: ${res.status}`);
      return null;
    }
    const limits = (await res.json()) as FormLimits;
    cache.set(workspaceId, { at: Date.now(), limits });
    return limits;
  } catch (err) {
    console.error('[quantalog] limits lookup failed:', err);
    return null;
  }
}

/**
 * Tell Quantalog a response was stored, so it counts against the cycle.
 *
 * Fire and forget: the response is already saved, and a failure here costs a
 * count, not data. The local cache is nudged too, so a burst of submissions
 * inside one TTL window still sees the number climbing rather than reading the
 * same stale figure until it expires.
 */
export async function recordSubmission(workspaceId: string): Promise<void> {
  if (!isConfigured()) return;

  const hit = cache.get(workspaceId);
  if (hit) hit.limits.submissionsUsed += 1;

  try {
    await fetch(
      `${env.quantalogApiUrl}/api/internal/forms/submissions/${encodeURIComponent(workspaceId)}`,
      {
        method: 'POST',
        headers: { authorization: `Bearer ${env.formsServiceSecret}` },
        signal: AbortSignal.timeout(4000),
      }
    );
  } catch (err) {
    console.error('[quantalog] could not record submission:', err);
  }
}

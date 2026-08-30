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

/** A field as Quantalog's generator describes it — no ids yet, no layout. */
export interface GeneratedField {
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  rows?: string[];
  content?: string;
  maxRating?: number;
  min?: number;
  max?: number;
}

export interface GeneratedForm {
  title: string;
  formDescription?: string;
  submitLabel?: string;
  fields: GeneratedField[];
  theme?: Record<string, unknown>;
}

export type GenerateOutcome =
  | { ok: true; form: GeneratedForm }
  | { ok: false; status: number; error: string; code?: string };

/**
 * Draft a form from a sentence.
 *
 * The model, the prompt and the AI quota all live in Quantalog — this service
 * holds no key and keeps no count. It asks, and gets back either a form or the
 * reason there isn't one.
 *
 * Errors are returned rather than swallowed, unlike the calls above: someone is
 * watching a modal wait for this, and "the AI is out of questions this month"
 * is something they need told, not logged.
 */
export async function generateForm(
  workspaceId: string,
  prompt: string,
  /** The form being revised, when this is a follow-up rather than a first ask. */
  previous?: GeneratedForm
): Promise<GenerateOutcome> {
  if (!isConfigured()) {
    return { ok: false, status: 503, error: 'Form generation is not configured.' };
  }

  try {
    const res = await fetch(
      `${env.quantalogApiUrl}/api/internal/forms/generate/${encodeURIComponent(workspaceId)}`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.formsServiceSecret}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(previous ? { prompt, previous } : { prompt }),
        // Generous next to the other calls: two model attempts run behind this,
        // and giving up at four seconds would abandon work already paid for.
        signal: AbortSignal.timeout(45_000),
      }
    );

    const body = (await res.json().catch(() => null)) as
      | { form?: GeneratedForm; error?: string; code?: string }
      | null;

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: body?.error ?? `Generation failed (${res.status}).`,
        code: body?.code,
      };
    }
    if (!body?.form) {
      return { ok: false, status: 502, error: 'Generation returned nothing usable.' };
    }
    return { ok: true, form: body.form };
  } catch (err) {
    console.error('[quantalog] generate failed:', err);
    return { ok: false, status: 504, error: 'The generator took too long to answer.' };
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

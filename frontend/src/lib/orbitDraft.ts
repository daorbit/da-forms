import type { GeneratedForm } from './generatedForm';

/**
 * The Orbit session, kept only so a reload does not throw it away.
 *
 * A draft costs real AI questions to produce, and the builder runs inside an
 * iframe — a refresh of the host page, a hot reload in development, a browser
 * that decides to reclaim the tab, and the conversation is gone along with the
 * allowance that paid for it.
 *
 * Deliberately not a history feature. It is cleared when the modal closes and
 * when a new session starts, so reopening Orbit is always a blank pane rather
 * than last week's half-finished form waiting to be dismissed.
 */

const KEY = 'quantalog:orbit-form-draft';

/**
 * How long a rescued session stays valid.
 *
 * Long enough to survive a reload and the time it takes to find the tab again,
 * short enough that a session abandoned before lunch is not offered back after
 * it. Past this it is stale work, not an interruption.
 */
const MAX_AGE_MS = 30 * 60 * 1000;

export interface OrbitDraft {
  /** The workspace it belongs to — a draft must not surface in another. */
  workspaceId: string;
  /** The form name chosen on the first step, so a resume is not half-configured. */
  formName: string;
  history: string[];
  form: GeneratedForm | null;
  at: number;
}

export function saveOrbitDraft(draft: Omit<OrbitDraft, 'at'>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...draft, at: Date.now() }));
  } catch {
    // Private browsing, a full quota, storage disabled outright. Losing the
    // safety net is not worth failing the thing it was protecting.
  }
}

/**
 * The saved session, if there is one worth offering back.
 *
 * Returns null for anything stale, malformed, from another workspace, or with
 * nothing in it — the caller then behaves exactly as it would on a first open,
 * with no branch of its own for "storage said something odd".
 */
export function readOrbitDraft(workspaceId: string): OrbitDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<OrbitDraft> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.workspaceId !== workspaceId) return null;
    if (typeof parsed.at !== 'number' || Date.now() - parsed.at > MAX_AGE_MS) return null;
    if (!Array.isArray(parsed.history) || parsed.history.length === 0) return null;

    return {
      workspaceId,
      formName: typeof parsed.formName === 'string' ? parsed.formName : '',
      history: parsed.history.filter((h): h is string => typeof h === 'string'),
      form: (parsed.form as GeneratedForm | null) ?? null,
      at: parsed.at,
    };
  } catch {
    return null;
  }
}

export function clearOrbitDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear if it could not be written in the first place */
  }
}

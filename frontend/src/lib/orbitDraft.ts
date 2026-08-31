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

/**
 * One exchange: what the person asked, and the form Orbit produced from it.
 *
 * The form is kept per turn so the thread can show every version, not only the
 * latest — a new prompt otherwise overwrites the one field summary and the
 * previous answer vanishes from the pane.
 */
export interface OrbitTurn {
  prompt: string;
  form: GeneratedForm | null;
}

export interface OrbitDraft {
  /** The workspace it belongs to — a draft must not surface in another. */
  workspaceId: string;
  /** The form name chosen on the first step, so a resume is not half-configured. */
  formName: string;
  turns: OrbitTurn[];
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

    const parsed = JSON.parse(raw) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.workspaceId !== workspaceId) return null;
    if (typeof parsed.at !== 'number' || Date.now() - parsed.at > MAX_AGE_MS) return null;

    const turns = readTurns(parsed);
    if (turns.length === 0) return null;

    return {
      workspaceId,
      formName: typeof parsed.formName === 'string' ? parsed.formName : '',
      turns,
      at: parsed.at,
    };
  } catch {
    return null;
  }
}

/**
 * Turns from either the current shape or the old `history: string[]` +
 * single `form`, so a session written by the previous build still resumes.
 */
function readTurns(parsed: Record<string, unknown>): OrbitTurn[] {
  if (Array.isArray(parsed.turns)) {
    return parsed.turns
      .filter((t): t is Record<string, unknown> => !!t && typeof t === 'object')
      .filter((t) => typeof t.prompt === 'string')
      .map((t) => ({
        prompt: t.prompt as string,
        form: (t.form as GeneratedForm | null) ?? null,
      }));
  }

  if (Array.isArray(parsed.history)) {
    const prompts = parsed.history.filter((h): h is string => typeof h === 'string');
    const form = (parsed.form as GeneratedForm | null) ?? null;
    // The old shape only kept the final form; hang it on the last prompt.
    return prompts.map((prompt, i) => ({
      prompt,
      form: i === prompts.length - 1 ? form : null,
    }));
  }

  return [];
}

export function clearOrbitDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear if it could not be written in the first place */
  }
}

import { useCallback, useEffect, useRef } from 'react';
import { savePartial } from '@/lib/api';

/** How long typing must pause before a save goes out. */
const DEBOUNCE_MS = 2500;

/**
 * The id for one person's attempt at one form.
 *
 * Kept in `sessionStorage` rather than `localStorage`: it identifies a sitting,
 * not a browser. Someone who submits, closes the tab and comes back to fill the
 * form in again is a second attempt and should not overwrite the first — but a
 * refresh mid-way through is the same one, and losing the key there would leave
 * two half-rows describing one person.
 */
function keyFor(formId: string): string {
  const storageKey = `da-forms:attempt:${formId}`;
  try {
    const existing = window.sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    window.sessionStorage.setItem(storageKey, fresh);
    return fresh;
  } catch {
    // Storage blocked. A key that lasts as long as the page still makes the
    // saves within this visit idempotent, which is most of the value.
    return crypto.randomUUID();
  }
}

/**
 * Mirrors what the respondent is typing to the server, so a form they abandon
 * still says where it lost them.
 *
 * Distinct from `useFormDraft`, which keeps the same answers in the
 * respondent's own browser so a refresh does not cost them their work. That one
 * serves the person filling the form in; this one serves the person who built
 * it. They are deliberately separate: a respondent may restore a draft on a
 * form whose owner never turned drop-off tracking on, and an owner may track
 * drop-off on a form nobody refreshes.
 *
 * Every failure is swallowed. This runs on a timer behind someone mid-sentence;
 * a draft save that did not land is not something they can act on, and an error
 * toast over a working form would be actively worse than silence.
 */
export function usePartialSave(formId: string | undefined, enabled: boolean) {
  const timer = useRef<number | null>(null);
  const attemptKey = useRef<string | null>(null);
  /** The last payload sent, so an unchanged form does not re-save on a blur. */
  const lastSent = useRef<string>('');

  // Cleared on unmount so a pending save cannot fire against a form the
  // respondent has already navigated away from.
  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const save = useCallback(
    (values: Record<string, string>, lastFieldId?: string, lastFieldIndex?: number) => {
      if (!formId || !enabled) return;

      // An empty form is not an abandonment — someone who opened the page and
      // left typed nothing, and a row for them would report a drop-off at a
      // field they never reached.
      const hasAnswers = Object.values(values).some((v) => (v ?? '').trim());
      if (!hasAnswers) return;

      const payload = JSON.stringify({ values, lastFieldId });
      if (payload === lastSent.current) return;

      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        lastSent.current = payload;
        if (!attemptKey.current) attemptKey.current = keyFor(formId);
        savePartial(formId, values, attemptKey.current, lastFieldId, lastFieldIndex).catch(
          () => {
            // Let the next keystroke try again: clearing this means an
            // unchanged payload is no longer considered already-sent.
            lastSent.current = '';
          }
        );
      }, DEBOUNCE_MS);
    },
    [formId, enabled]
  );

  /**
   * The key to send with the submission, so the server promotes this attempt's
   * row instead of leaving it beside the finished response.
   *
   * Null when nothing was ever saved — a fast respondent who submitted before
   * the first debounce elapsed has no row to promote, and sending a key for one
   * that does not exist would make the server look for it on every submit.
   */
  const submitKey = useCallback(() => attemptKey.current, []);

  /** Called once the form is sent: the attempt is over, the next one is new. */
  const clear = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    attemptKey.current = null;
    lastSent.current = '';
    if (!formId) return;
    try {
      window.sessionStorage.removeItem(`da-forms:attempt:${formId}`);
    } catch {
      // Unreachable storage — the in-memory key is already cleared above.
    }
  }, [formId]);

  return { save, submitKey, clear };
}

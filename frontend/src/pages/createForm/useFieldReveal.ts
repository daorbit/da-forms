import { useEffect, useRef, useState } from 'react';

/**
 * Gap between two fields arriving, in ms.
 *
 * Slow enough to read as one field being written after another. Below about
 * 200ms the whole form is on screen inside half a second and the effect is
 * indistinguishable from it simply appearing.
 */
const STEP_MS = 260;
/** Beat before the first field, so the header lands on its own. */
const LEAD_MS = 420;

interface Options {
  /** How many fields the finished form has. 0 while nothing is drafted. */
  total: number;
  /** Whether to animate at all — a revision of an existing draft should not
   *  re-deal the whole form from nothing. */
  enabled: boolean;
}

/**
 * Deals a generated form's fields out one at a time.
 *
 * Returns how many of them are currently on screen, which the caller uses to
 * slice the field list it hands the renderer. Doing it this way rather than
 * animating every field's opacity means a field that has not arrived yet takes
 * no layout space, so the card grows as the form is written — which is the part
 * that reads as the form being built rather than faded in.
 *
 * `done` flips once the last field has landed, and is what the ready bar waits
 * for: showing "Create form" while fields are still appearing invites a click
 * on a form that looks half-written.
 */
export function useFieldReveal({ total, enabled }: Options) {
  const [shown, setShown] = useState(enabled ? 0 : total);
  const timers = useRef<number[]>([]);
  /**
   * Whether the staggered deal has already been played once.
   *
   * A ref rather than state: it must be readable inside the effect without
   * putting the effect back in the dependency list, and changing it should not
   * itself cause a render.
   */
  const played = useRef(false);

  useEffect(() => {
    // Clear whatever the previous run scheduled. Without this, a second
    // generation started mid-reveal would have two sets of timers racing to set
    // `shown` and the count would jump backwards.
    timers.current.forEach(clearTimeout);
    timers.current = [];

    /*
     * Every field at once, with no pass through zero.
     *
     * The reset to zero is what made revisions flicker: `total` changes when a
     * revised form arrives, so the effect re-ran, `shown` dropped to 0, `done`
     * went false, and anything gated on it — the ready bar — unmounted and
     * animated back in while the page height jumped around it.
     */
    if (!enabled || played.current || total === 0) {
      setShown(total);
      return;
    }

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setShown(total);
      return;
    }

    played.current = true;
    setShown(0);
    for (let i = 1; i <= total; i++) {
      const id = window.setTimeout(() => setShown(i), LEAD_MS + i * STEP_MS);
      timers.current.push(id);
    }

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [total, enabled]);

  return { shown, done: shown >= total && total > 0 };
}

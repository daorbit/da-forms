import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tracks a history of serialized snapshots of arbitrary builder state and
 * lets the caller step backward/forward through it, restoring each snapshot
 * via a caller-supplied apply function.
 *
 * Snapshots are pushed on a debounce so a burst of changes (typing a label,
 * dragging a color slider) becomes one history entry instead of one per
 * keystroke — undo should step through meaningful edits, not characters.
 */
export function useUndoHistory<T>(
  current: T,
  serialize: (value: T) => string,
  apply: (value: T) => void,
  options: { debounceMs?: number; maxSize?: number; resetKey?: string | number } = {}
) {
  const { debounceMs = 500, maxSize = 100, resetKey } = options;
  const historyRef = useRef<string[]>([serialize(current)]);
  const indexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The last snapshot applied *by undo/redo itself* — pushing must ignore the
  // change that follows it, or restoring a snapshot would immediately record
  // itself as a new one and stomp everything after the current index.
  const restoringRef = useRef<string | null>(null);
  const resetKeyRef = useRef(resetKey);
  const [, forceRender] = useState(0);

  // Re-seeds the history when resetKey changes — for async data (an existing
  // form loading in after mount), the hook's initial snapshot is taken before
  // that data arrives, so it's the wrong baseline. The caller flips resetKey
  // once the real starting state is in, and history starts clean from there.
  if (resetKeyRef.current !== resetKey) {
    resetKeyRef.current = resetKey;
    historyRef.current = [serialize(current)];
    indexRef.current = 0;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  useEffect(() => {
    const snapshot = serialize(current);
    if (restoringRef.current === snapshot) {
      restoringRef.current = null;
      return;
    }
    if (historyRef.current[indexRef.current] === snapshot) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const history = historyRef.current;
      // A push after undoing discards the redo branch, same as any editor.
      const truncated = history.slice(0, indexRef.current + 1);
      truncated.push(snapshot);
      if (truncated.length > maxSize) truncated.shift();
      historyRef.current = truncated;
      indexRef.current = truncated.length - 1;
      forceRender((n) => n + 1);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const undo = useCallback(() => {
    if (indexRef.current <= 0) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    indexRef.current -= 1;
    const snapshot = historyRef.current[indexRef.current];
    restoringRef.current = snapshot;
    apply(JSON.parse(snapshot));
    forceRender((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redo = useCallback(() => {
    if (indexRef.current >= historyRef.current.length - 1) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    indexRef.current += 1;
    const snapshot = historyRef.current[indexRef.current];
    restoringRef.current = snapshot;
    apply(JSON.parse(snapshot));
    forceRender((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    undo,
    redo,
    canUndo: indexRef.current > 0,
    canRedo: indexRef.current < historyRef.current.length - 1,
  };
}

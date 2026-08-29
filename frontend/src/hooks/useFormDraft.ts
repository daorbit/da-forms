import { useCallback, useEffect, useRef, useState } from 'react';

/** How long an untouched draft is worth restoring before it is stale. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface Draft {
  values: Record<string, string>;
  pageIndex: number;
  savedAt: number;
}

function keyFor(formId: string) {
  return `da-forms:draft:${formId}`;
}

/**
 * Keeps a respondent's in-progress answers in their own browser.
 *
 * A four-step application is several minutes of typing, and until now a stray
 * refresh or a closed tab lost all of it. The draft is per-form, per-browser:
 * it never leaves the device, and it is cleared the moment the form is
 * submitted so a shared computer does not hand the next person a filled form.
 *
 * Storage can throw outright — Safari private mode, a browser set to block
 * site data — so every access is guarded and failure just means no draft.
 */
export function useFormDraft(formId: string | undefined, enabled: boolean) {
  const [restored, setRestored] = useState<Draft | null>(null);
  const [checked, setChecked] = useState(false);
  // Written on every keystroke, so the read that looks for a draft must happen
  // before any of those writes land.
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!formId || !enabled || loadedRef.current) {
      setChecked(true);
      return;
    }
    loadedRef.current = true;
    try {
      const raw = window.localStorage.getItem(keyFor(formId));
      if (raw) {
        const draft = JSON.parse(raw) as Draft;
        const fresh = Date.now() - (draft.savedAt ?? 0) < MAX_AGE_MS;
        const hasAnswers = Object.values(draft.values ?? {}).some((v) => (v ?? '').trim());
        if (fresh && hasAnswers) setRestored(draft);
        else window.localStorage.removeItem(keyFor(formId));
      }
    } catch {
      // No draft, and nothing the respondent can do about it.
    }
    setChecked(true);
  }, [formId, enabled]);

  const save = useCallback(
    (values: Record<string, string>, pageIndex: number) => {
      if (!formId || !enabled) return;
      try {
        const hasAnswers = Object.values(values).some((v) => (v ?? '').trim());
        if (!hasAnswers) return;
        const draft: Draft = { values, pageIndex, savedAt: Date.now() };
        window.localStorage.setItem(keyFor(formId), JSON.stringify(draft));
      } catch {
        // Over quota or storage disabled — carry on without a draft.
      }
    },
    [formId, enabled]
  );

  const clear = useCallback(() => {
    if (!formId) return;
    try {
      window.localStorage.removeItem(keyFor(formId));
    } catch {
      // Nothing to do: the draft is either gone or unreachable.
    }
    setRestored(null);
  }, [formId]);

  return { restored, checked, save, clear };
}

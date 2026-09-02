import { useEffect, useRef } from 'react';

/**
 * Cloudflare's own widget script. Loaded once per page and shared by every
 * instance — a second `<script>` re-registers the same global and throws.
 */
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          size?: 'normal' | 'flexible' | 'compact';
          appearance?: 'always' | 'execute' | 'interaction-only';
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

/** Loads the widget script once, and hands every later caller the same promise. */
function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('turnstile script failed'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface Props {
  /** From `VITE_TURNSTILE_SITE_KEY`. Nothing renders without one. */
  siteKey: string;
  /** Called with the token, and with null when it expires or errors. */
  onToken: (token: string | null) => void;
}

/**
 * The challenge a respondent has to pass before their answers are accepted.
 *
 * `interaction-only` appearance: most people never see it, and the ones
 * Cloudflare is unsure about get a checkbox rather than a puzzle. A form is
 * already work to fill in, and spam protection that costs a real respondent
 * thirty seconds has taken more from the owner than the spam would have.
 *
 * The token is short-lived and single-use, so it is passed up on every issue
 * rather than read at submit time — an expired token has to be replaced by a
 * fresh one, which the widget does on its own.
 */
export function TurnstileGate({ siteKey, onToken }: Props) {
  const host = useRef<HTMLDivElement>(null);
  // The callback changes identity on every render of the parent form; keeping
  // it in a ref stops that from tearing down and re-rendering the widget, which
  // would reset the challenge under someone mid-form.
  const callback = useRef(onToken);
  callback.current = onToken;

  useEffect(() => {
    if (!siteKey || !host.current) return;
    let widgetId: string | undefined;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !host.current || !window.turnstile) return;
        widgetId = window.turnstile.render(host.current, {
          sitekey: siteKey,
          size: 'flexible',
          appearance: 'interaction-only',
          callback: (token) => callback.current(token),
          'expired-callback': () => callback.current(null),
          'error-callback': () => callback.current(null),
        });
      })
      .catch(() => {
        // Cloudflare unreachable. The server treats an unverifiable challenge
        // as a pass for exactly this case, so the form stays usable rather than
        // trapping every respondent behind a script that will not load.
        callback.current(null);
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey]);

  return <div ref={host} />;
}

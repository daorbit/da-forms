/**
 * The bits every gateway's checkout needs around opening its window.
 *
 * All three — Razorpay, Cashfree Bolt, PayU Bolt — open an in-page modal over
 * this page, and all three hit the same problem: the public form pins the
 * viewport (`html, body { overflow: hidden; height: 100% }`, with `#root`
 * scrolling), which each SDK reads as a broken viewport and answers with its
 * full-page fallback. A drawer or modal may also have left an inline
 * scroll-lock on `<body>`.
 *
 * `unlockForCheckout` clears the lock and adds `rzp-checkout-open` — the class
 * global.css uses to unpin the shell so the document scrolls normally.
 * `relockAfterCheckout` undoes it. Call the first before opening, the second
 * on every settle path.
 */

const OPEN_CLASS = "rzp-checkout-open";

const LOCK_PROPS = [
  "overflow",
  "overflow-x",
  "overflow-y",
  "padding-right",
  "position",
  "top",
  "width",
];

export function unlockForCheckout(): void {
  for (const el of [document.documentElement, document.body]) {
    for (const prop of LOCK_PROPS) el.style.removeProperty(prop);
    el.removeAttribute("data-mantine-scroll-locked");
  }
  document.body.classList.add(OPEN_CLASS);
}

export function relockAfterCheckout(): void {
  document.body.classList.remove(OPEN_CLASS);
}

/**
 * Load a third-party script once, caching the promise.
 *
 * `key` names a global the script defines, so a script that is already present
 * (a second submit, a warm cache) resolves immediately. On failure the cache is
 * cleared so a later attempt can retry rather than reusing a rejected promise.
 */
const loaders = new Map<string, Promise<void>>();

export function loadScriptOnce(src: string, key: keyof Window): Promise<void> {
  if (window[key]) return Promise.resolve();
  const existing = loaders.get(src);
  if (existing) return existing;

  const p = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loaders.delete(src);
      reject(
        new Error("Could not load the payment window. Check your connection and try again."),
      );
    };
    document.body.appendChild(script);
  });

  loaders.set(src, p);
  return p;
}

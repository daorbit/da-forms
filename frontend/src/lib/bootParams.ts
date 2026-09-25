/**
 * The query string the app was opened with, captured before any navigation.
 *
 * Theme and `embedded` arrive that way and are read at mount. Routing changes
 * the URL, so reading `window.location.search` later would come back empty and
 * the app would appear to lose its theme the first time someone clicked a link.
 */
export const BOOT_SEARCH = window.location.search;

const params = new URLSearchParams(BOOT_SEARCH);

export function bootParam(name: string): string | null {
  return params.get(name);
}

/** True when a host product embedded this app and owns the outer chrome. */
export const IS_EMBEDDED = params.get('embedded') === '1';

/**
 * Proof from the host product that this browser may act for its workspace.
 *
 * Minted by Quantalog, which owns the session, and required by the routes that
 * read or overwrite payment credentials — a workspace id in a URL is not
 * something anyone should be able to point at someone else's Razorpay account.
 *
 * Read from the boot query string for the same reason as the theme: routing
 * rewrites the URL, and the token would otherwise vanish on the first click.
 */
export const WORKSPACE_TOKEN = params.get('wt') ?? '';

/**
 * True when the host paints a textured background (a gradient, mesh, grid or
 * starfield) behind this frame. The page then leaves its own ground
 * transparent so that background shows through, as on every host page.
 */
export const HOST_TEXTURED_BG = IS_EMBEDDED && params.get('bg') === 'textured';

/**
 * The host's background as a CSS value (gradients over its ground colour),
 * for the full-screen dialogs that cover the frame and so hide what the page
 * lets through. Only gradients and colours are accepted — nothing that could
 * fetch a resource or break out of the declaration.
 */
export const HOST_BG_WASH: string | null = (() => {
  if (!HOST_TEXTURED_BG) return null;
  const raw = params.get('bgwash');
  if (!raw || raw.length > 4000) return null;
  if (/url\(|expression|image-set|[;{}<>@\\]/i.test(raw)) return null;
  return raw;
})();

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

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

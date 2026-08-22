import { useCallback } from 'react';

/**
 * Keeps the boot query string on internal links.
 *
 * Theme and `embedded` arrive on the URL and are read at mount, so a link that
 * dropped them would reload the app unthemed the moment someone navigated.
 */
export function useAppLink() {
  const search = window.location.search;
  return useCallback((path: string) => `${path}${search}`, [search]);
}

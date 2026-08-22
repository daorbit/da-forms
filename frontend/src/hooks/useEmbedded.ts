import { IS_EMBEDDED } from '@/lib/bootParams';

/**
 * Whether this app is running inside a host product.
 *
 * Read from the URL the host opened, not from frame detection: the host decides
 * how much of our own chrome it wants, and a bare iframe on someone's site is
 * not the same situation as a product embedding the whole builder.
 */
export function useEmbedded(): boolean {
  return IS_EMBEDDED;
}

import { useEffect, useState } from 'react';

/** One in-memory cache shared across every call, keyed by URL — a HEAD to the
 *  same Cloudinary URL from ten table rows on the same page would otherwise
 *  fire ten identical requests. Undefined means "not fetched yet", null means
 *  "fetched, no size available" (server didn't send Content-Length). */
const cache = new Map<string, number | null>();

/**
 * Fallback for a submission with no `fileMeta` (made before that was
 * recorded at upload time) — reads the size off the `Content-Length` header
 * of a HEAD request to the file's own URL instead.
 *
 * Returns `undefined` while loading/unknown, so callers can render nothing
 * rather than a "0 B" placeholder that would be wrong more often than right.
 */
export function useFileSize(url: string | undefined): number | undefined {
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!url || cache.has(url)) return;
    let cancelled = false;
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        if (cancelled) return;
        const len = res.headers.get('content-length');
        cache.set(url, len ? Number(len) : null);
        forceRender((n) => n + 1);
      })
      .catch(() => {
        if (!cancelled) {
          cache.set(url, null);
          forceRender((n) => n + 1);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!url) return undefined;
  const bytes = cache.get(url);
  return bytes == null ? undefined : bytes;
}

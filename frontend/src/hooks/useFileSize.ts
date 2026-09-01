import { useEffect, useState } from 'react';

/** One in-memory cache shared across every call, keyed by URL — a HEAD to the
 *  same Cloudinary URL from ten table rows on the same page would otherwise
 *  fire ten identical requests. Undefined means "not fetched yet", null means
 *  "fetched, no size available" (server didn't send Content-Length). */
const cache = new Map<string, number | null>();

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

/**
 * A file's size, read off the `Content-Length` header of a HEAD request to
 * its URL rather than stored anywhere — the submission's file fields hold a
 * bare URL string, not an object, so this is the size without widening that
 * shape everywhere it's read and written.
 *
 * Returns `undefined` while loading/unknown, so callers can render nothing
 * rather than a "0 B" placeholder that would be wrong more often than right.
 */
export function useFileSize(url: string | undefined): string | undefined {
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
  return bytes == null ? undefined : formatBytes(bytes);
}

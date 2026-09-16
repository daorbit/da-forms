import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bannerCid, type BannerName } from './emailTemplates.js';

/**
 * The illustrated header, as a MIME part.
 *
 * Read from disk once per banner and kept — the files ship with the service and
 * never change between sends, so re-reading them per notification would be
 * filesystem work for no benefit.
 *
 * Null-tolerant by design: a missing image costs the header strip, not the
 * notification. `shell` falls back to its accent rule when no banner is given,
 * so a message with no art still looks finished rather than broken.
 */
export type BannerPart = {
  filename: string;
  content: Buffer;
  cid: string;
  contentType: string;
};

const cache = new Map<BannerName, BannerPart | null>();

export function bannerAttachment(name: BannerName): BannerPart | null {
  const cached = cache.get(name);
  if (cached !== undefined) return cached;

  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // dist/lib -> dist -> package root
    path.join(here, '..', '..', 'public', 'email-banners', `${name}.jpg`),
    path.join(process.cwd(), 'public', 'email-banners', `${name}.jpg`),
  ];

  for (const file of candidates) {
    try {
      const part: BannerPart = {
        filename: `${name}.jpg`,
        content: readFileSync(file),
        cid: bannerCid(name),
        contentType: 'image/jpeg',
      };
      cache.set(name, part);
      return part;
    } catch {
      continue;
    }
  }

  console.warn(`[mail] banner "${name}" not found — sending without a header image`);
  cache.set(name, null);
  return null;
}

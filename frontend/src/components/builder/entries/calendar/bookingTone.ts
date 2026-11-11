export const TONE_COUNT = 6;

export function toneOf(key: string | undefined): number {
  if (!key) return 0;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return hash % TONE_COUNT;
}

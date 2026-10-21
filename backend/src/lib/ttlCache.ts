type Entry<T> = { value: Promise<T>; expires: number };

export function createTtlCache<T>(ttlMs: number, maxEntries = 500) {
  const store = new Map<string, Entry<T>>();

  function load(key: string, fetch: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const hit = store.get(key);
    if (hit && hit.expires > now) return hit.value;

    if (store.size >= maxEntries) {
      const oldest = store.keys().next().value;
      if (oldest !== undefined) store.delete(oldest);
    }

    const value = fetch();
    store.set(key, { value, expires: now + ttlMs });
    value.catch(() => store.delete(key));
    return value;
  }

  function forget(key: string): void {
    store.delete(key);
  }

  return { load, forget };
}

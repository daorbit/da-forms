import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const PREFIX = 'lead-capture:';

function read(name: string): string | null {
  try {
    return sessionStorage.getItem(PREFIX + name);
  } catch {
    return null;
  }
}

function write(name: string, value: string | null) {
  try {
    if (value) sessionStorage.setItem(PREFIX + name, value);
    else sessionStorage.removeItem(PREFIX + name);
  } catch {
    return;
  }
}

export function useRememberedParams(names: string[]) {
  const [params, setParams] = useSearchParams();
  const signature = names.map((n) => `${n}=${params.get(n) ?? ''}`).join('&');

  useEffect(() => {
    const missing = names.filter((n) => !params.has(n) && read(n));
    if (!missing.length) return;
    const next = new URLSearchParams(params);
    for (const n of missing) next.set(n, read(n) as string);
    setParams(next, { replace: true });
  }, []);

  useEffect(() => {
    for (const n of names) if (params.has(n) || read(n)) write(n, params.get(n));
  }, [signature]);
}

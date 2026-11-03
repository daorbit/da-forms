import { useEffect, useState } from 'react';
import { IS_EMBEDDED } from '@/lib/bootParams';
import { applyHostTokens } from '@/app/hostTokens';
import { readHostTheme, type HostTheme } from '@/app/themeParams';

const THEME = 'quantalog:theme';
const MAX_SEARCH_LENGTH = 1000;

export function useHostTheme(initial: HostTheme): HostTheme {
  const [host, setHost] = useState(initial);

  useEffect(() => {
    if (!IS_EMBEDDED || window.parent === window) return;

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const data = event.data as { type?: unknown; search?: unknown } | null;
      if (data?.type !== THEME || typeof data.search !== 'string') return;
      if (data.search.length > MAX_SEARCH_LENGTH) return;
      const next = readHostTheme(data.search);
      applyHostTokens(next);
      setHost(next);
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return host;
}

import { useEffect, useState } from 'react';
import { IS_EMBEDDED } from '@/lib/bootParams';

const COUNT = 'quantalog:unread-count';
const COUNT_REQUEST = 'quantalog:unread-count-request';

export function useHostUnreadCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!IS_EMBEDDED || window.parent === window) return;

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const data = event.data as { type?: unknown; count?: unknown } | null;
      if (data?.type !== COUNT || typeof data.count !== 'number') return;
      setCount(Math.max(0, data.count));
    };

    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: COUNT_REQUEST }, '*');
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return count;
}

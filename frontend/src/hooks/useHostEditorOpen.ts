import { useEffect } from 'react';
import { IS_EMBEDDED } from '@/lib/bootParams';

const EDITOR = 'quantalog:editor-open';

function announce(open: boolean) {
  window.parent.postMessage({ type: EDITOR, open }, '*');
}

export function useHostEditorOpen() {
  useEffect(() => {
    if (!IS_EMBEDDED || window.parent === window) return;
    const close = () => announce(false);
    announce(true);
    window.addEventListener('pagehide', close);
    return () => {
      window.removeEventListener('pagehide', close);
      close();
    };
  }, []);
}

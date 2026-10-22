import { useEffect } from 'react';
import { IS_EMBEDDED } from '@/lib/bootParams';

function dismissFloatingLayers() {
  document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
}

export function useDismissOnHostFocus() {
  useEffect(() => {
    if (!IS_EMBEDDED) return;
    window.addEventListener('blur', dismissFloatingLayers);
    return () => window.removeEventListener('blur', dismissFloatingLayers);
  }, []);
}

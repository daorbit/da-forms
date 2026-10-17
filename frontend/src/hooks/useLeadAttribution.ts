import { useEffect } from 'react';
import { HOST_CONTEXT_MESSAGE, captureTouch, rememberHostTouch } from '@/lib/attribution';

export function useLeadAttribution(formId: string | undefined, enabled: boolean) {
  useEffect(() => {
    if (!formId || !enabled) return;
    captureTouch(formId);
    if (window.self === window.top) return;

    const onMessage = (e: MessageEvent) => {
      if (e.source !== window.parent || e.data?.type !== HOST_CONTEXT_MESSAGE) return;
      rememberHostTouch(formId, e.data);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [formId, enabled]);
}

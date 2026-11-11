import { IS_EMBEDDED } from './bootParams';

const QUANTALOG_APP_URL = (
  import.meta.env.VITE_QUANTALOG_APP_URL ?? 'https://studio-quantalog.daorbit.in'
).replace(/\/$/, '');

const CONNECTIONS_PATH = '/app/apps';

export function connectionsUrl(appId?: string): string {
  const query = appId ? `?app=${encodeURIComponent(appId)}` : '';
  return `${QUANTALOG_APP_URL}${CONNECTIONS_PATH}${query}`;
}

let awaitingReturn = false;

export function openConnections(appId?: string) {
  if (IS_EMBEDDED && window.parent !== window) {
    window.parent.postMessage({ type: 'quantalog:open-integrations', app: appId }, '*');
    return;
  }
  awaitingReturn = true;
  window.open(connectionsUrl(appId), '_blank', 'noopener');
}

const HOST_FORMS_PATH = '/app/lead-capture';
const HOST_NAV_FALLBACK_MS = 600;

export const HOST_FORMS_URL = `${QUANTALOG_APP_URL}${HOST_FORMS_PATH}`;

export function openHostForms() {
  window.parent.postMessage({ type: 'quantalog:open-forms' }, '*');
  window.setTimeout(() => {
    window.top?.location.assign(HOST_FORMS_URL);
  }, HOST_NAV_FALLBACK_MS);
}

export function onReturnFromConnections(handler: () => void): () => void {
  const listener = () => {
    if (!awaitingReturn) return;
    awaitingReturn = false;
    handler();
  };
  window.addEventListener('focus', listener);
  return () => window.removeEventListener('focus', listener);
}

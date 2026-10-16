import { IS_EMBEDDED } from './bootParams';

const QUANTALOG_APP_URL = (
  import.meta.env.VITE_QUANTALOG_APP_URL ?? 'https://studio-quantalog.daorbit.in'
).replace(/\/$/, '');

const CONNECTIONS_PATH = '/app/settings/connections';

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

export function openProfileSettings() {
  if (IS_EMBEDDED && window.parent !== window) {
    window.parent.postMessage({ type: 'quantalog:open-profile' }, '*');
    return;
  }
  awaitingReturn = true;
  window.open(`${QUANTALOG_APP_URL}/app/settings/profile`, '_blank', 'noopener');
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

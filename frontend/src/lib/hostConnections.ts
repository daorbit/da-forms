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

export function hostInsightsUrl(formId: string): string {
  return `${QUANTALOG_APP_URL}/app/lead-insights?form=${encodeURIComponent(formId)}`;
}

function navigateHost(message: Record<string, string>, fallbackUrl: string) {
  window.parent.postMessage(message, '*');
  window.setTimeout(() => {
    window.top?.location.assign(fallbackUrl);
  }, HOST_NAV_FALLBACK_MS);
}

export function openHostForms() {
  navigateHost({ type: 'quantalog:open-forms' }, HOST_FORMS_URL);
}

export function openHostInsights(formId: string) {
  navigateHost({ type: 'quantalog:open-insights', form: formId }, hostInsightsUrl(formId));
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

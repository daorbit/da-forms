import { WORKSPACE_TOKEN } from './bootParams';

/**
 * The token proving this session may act for its workspace.
 *
 * Arrives in the boot URL, but only lasts an hour — and the builder is a place
 * people leave open far longer than that. Rather than let every request start
 * failing at the sixty minute mark, the host is asked for a fresh one when the
 * current token is refused.
 *
 * Held in a module variable rather than React state because `api.ts` reads it
 * on every call and is not a component.
 */
let current = WORKSPACE_TOKEN;

export function workspaceToken(): string {
  return current;
}

/**
 * The token, asking the host for one if we have none yet.
 *
 * The host loads this app immediately rather than holding the frame back until
 * a token exists — its own loading states are better than a blank parent
 * guessing at them — so the first workspace call is usually what discovers
 * there is no token to send. Awaiting this once, up front, means that call
 * carries one instead of failing and retrying.
 */
let askedOnce = false;
let asking: Promise<string> | null = null;

export async function ensureWorkspaceToken(): Promise<string> {
  if (current) return current;
  // A request already in flight is awaited rather than skipped. Several calls
  // can start together on one screen, and answering the later ones with an
  // empty string sent them without a token — refused by the server, then
  // repeated once the first ask finally landed.
  if (asking) return asking;
  // Asked at most once. Standalone use has no host to answer, and waiting out
  // the timeout on every call afterwards would make the whole app crawl.
  if (askedOnce) return '';
  askedOnce = true;
  asking = refreshWorkspaceToken().finally(() => {
    asking = null;
  });
  return asking;
}

/** Whether the host ever gave us one — false in standalone or demo use. */
export function hasWorkspaceToken(): boolean {
  return Boolean(current);
}

type Waiter = (token: string) => void;
let waiters: Waiter[] = [];
let pending = false;

/**
 * Ask the host product for a new token.
 *
 * Resolves with the replacement, or with an empty string if the host does not
 * answer — it may be an older build, or this may not be embedded at all. One
 * request is in flight at a time: a page that fires six calls at once would
 * otherwise ask six times for the same thing.
 */
export function refreshWorkspaceToken(timeoutMs = 5000): Promise<string> {
  if (typeof window === 'undefined' || window.parent === window) {
    return Promise.resolve('');
  }
  // An expiry refresh is a fresh ask, whatever the startup attempt concluded.
  askedOnce = true;

  return new Promise((resolve) => {
    waiters.push(resolve);
    if (pending) return;
    pending = true;

    const settle = (token: string) => {
      if (!pending) return;
      pending = false;
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      if (token) current = token;
      const pendingWaiters = waiters;
      waiters = [];
      for (const waiter of pendingWaiters) waiter(token);
    };

    function onMessage(event: MessageEvent) {
      // The host's origin is not known here — it is whatever product embedded
      // this — so the message is identified by its shape instead. Nothing
      // secret is being sent outward, and a forged token simply fails
      // verification at the server, which is the check that actually matters.
      if (event.data?.type !== 'quantalog:workspace-token') return;
      settle(typeof event.data.token === 'string' ? event.data.token : '');
    }

    const timer = setTimeout(() => settle(''), timeoutMs);
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: 'quantalog:workspace-token-request' }, '*');
  });
}

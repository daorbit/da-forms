import { IS_EMBEDDED } from './bootParams';
import type { ApiError } from './api';

/** The cap the server says was hit. Mirrors `backend/src/lib/plan-limit.ts`. */
export interface PlanLimitInfo {
  kind?: string;
  label?: string;
  used?: number;
  quota?: number;
  plan?: string;
}

export interface PlanLimitEvent {
  message: string;
  limit?: PlanLimitInfo;
}

/** Both codes end at the same dialog — the reader's next step is identical. */
const PLAN_LIMIT_CODES = ['quota_exceeded', 'plan_required'];

export function isPlanLimit(err: unknown): err is ApiError {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === 'string' && PLAN_LIMIT_CODES.includes(code);
}

export function planLimitInfo(err: unknown): PlanLimitInfo | undefined {
  const limit = (err as { limit?: unknown } | null)?.limit;
  return typeof limit === 'object' && limit !== null ? (limit as PlanLimitInfo) : undefined;
}

/**
 * How a plan limit reaches the dialog.
 *
 * A DOM event rather than a state library: the API layer is a plain module with
 * no React around it, and a cap can be hit by any request on any screen. One
 * listener mounted once at the root is what keeps every one of them ending at
 * the same dialog without threading a callback through the app.
 */
const PLAN_LIMIT_EVENT = 'da-forms:plan-limit';

export function onPlanLimit(handler: (detail: PlanLimitEvent) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<PlanLimitEvent>).detail);
  window.addEventListener(PLAN_LIMIT_EVENT, listener);
  return () => window.removeEventListener(PLAN_LIMIT_EVENT, listener);
}

export function showPlanLimit(message: string, limit?: PlanLimitInfo) {
  window.dispatchEvent(
    new CustomEvent<PlanLimitEvent>(PLAN_LIMIT_EVENT, { detail: { message, limit } })
  );
}

/**
 * Ask the host product to take the reader to billing.
 *
 * This app has no billing page of its own — plans live in Quantalog, which
 * embeds this one in an iframe. Navigating our own window would only move the
 * frame; `window.top.location` is blocked cross-origin. So the host is told what
 * happened and does the routing, which also means it keeps owning where billing
 * actually lives.
 */
export function requestUpgrade() {
  if (IS_EMBEDDED && window.parent !== window) {
    window.parent.postMessage({ type: 'quantalog:upgrade' }, '*');
  }
}

/**
 * Surface a plan limit if that is what the failure was.
 *
 * Returns whether it handled the error, so a call site can skip its own toast
 * rather than stacking a red bar underneath the dialog.
 */
export function handlePlanLimit(err: unknown): boolean {
  if (!isPlanLimit(err)) return false;
  const message = err instanceof Error ? err.message : 'Upgrade your plan to continue.';
  showPlanLimit(message, planLimitInfo(err));
  return true;
}

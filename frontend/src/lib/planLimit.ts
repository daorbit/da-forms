import { IS_EMBEDDED } from './bootParams';
import type { ApiError } from './api';

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

const PLAN_LIMIT_CODES = ['quota_exceeded', 'plan_required'];

export function isPlanLimit(err: unknown): err is ApiError {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === 'string' && PLAN_LIMIT_CODES.includes(code);
}

export function planLimitInfo(err: unknown): PlanLimitInfo | undefined {
  const limit = (err as { limit?: unknown } | null)?.limit;
  return typeof limit === 'object' && limit !== null ? (limit as PlanLimitInfo) : undefined;
}


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


export function requestUpgrade() {
  if (IS_EMBEDDED && window.parent !== window) {
    window.parent.postMessage({ type: 'quantalog:upgrade' }, '*');
  }
}


export function requestOpenNotifications() {
  if (IS_EMBEDDED && window.parent !== window) {
    window.parent.postMessage({ type: 'quantalog:open-notifications' }, '*');
  }
}


export function handlePlanLimit(err: unknown): boolean {
  if (!isPlanLimit(err)) return false;
  const message = err instanceof Error ? err.message : 'Upgrade your plan to continue.';
  showPlanLimit(message, planLimitInfo(err));
  return true;
}

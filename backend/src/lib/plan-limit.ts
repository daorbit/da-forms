import type { Response } from 'express';

/**
 * What the client is told about a cap that was hit.
 *
 * Deliberately the same shape Quantalog's own routes send: this service is
 * embedded in that dashboard, and its refusals should reach the same upgrade
 * dialog rather than a red toast that says nothing about which allowance ran
 * out. Keep the field names in step with `real-ana-be/src/http/plan-limit.ts`.
 */
export interface PlanLimitInfo {
  /** Machine name of the cap: `forms`, `form_submissions`. */
  kind: string;
  /** Human name for the dialog heading: "Forms", "Responses". */
  label: string;
  used?: number;
  quota?: number;
  plan?: string;
}

/**
 * `quota_exceeded` is an allowance used up; `plan_required` is a feature the
 * plan never included.
 */
export type PlanLimitCode = 'quota_exceeded' | 'plan_required';

/**
 * Refuse a request because of the workspace's Quantalog plan.
 *
 * `error` carries the sentence a person reads. The machine-readable slug lives
 * in `code`, not in `error` — a client showing `error` verbatim should never
 * end up printing `form_limit_reached` at a customer.
 */
export function planLimit(
  res: Response,
  error: string,
  limit?: PlanLimitInfo,
  code: PlanLimitCode = 'quota_exceeded'
) {
  return res.status(402).json({ error, code, ...(limit ? { limit } : {}) });
}

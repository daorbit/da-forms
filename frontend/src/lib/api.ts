import type { HealthResponse, Form, FormField, Submission, Paginated } from '@/types';
import { handlePlanLimit, type PlanLimitInfo } from './planLimit';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export function publicFormPath(formId: string) {
  return `/from/${formId}/view`;
}

export function publicFormUrl(formId: string) {
  return `${window.location.origin}${publicFormPath(formId)}`;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
    public limit?: PlanLimitInfo
  ) {
    super(message);
  }
}

async function errorFrom(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => null);
  const message = body?.message ?? body?.error ?? `${res.status} ${res.statusText}`;
  return new ApiError(res.status, body?.code ?? body?.error, message, body?.limit);
}

function raise(err: ApiError): never {
  handlePlanLimit(err);
  throw err;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) raise(await errorFrom(res));
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const DEFAULT_WORKSPACE = 'default';

function ws(workspaceId: string) {
  return `/workspaces/${encodeURIComponent(workspaceId)}/forms`;
}

export function getHealth() {
  return request<HealthResponse>('/health');
}

export interface WorkspaceStats {
  totalForms: number;
  publishedForms: number;
  draftForms: number;
  totalViews: number;
  totalSubmissions: number;
}

export interface FormListResult extends Paginated<Form> {
  stats: WorkspaceStats;
}

export function listForms(
  workspaceId = DEFAULT_WORKSPACE,
  options: {
    page?: number;
    limit?: number;
    q?: string;
    sort?: string;
    status?: 'published' | 'draft';
  } = {}
) {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.q) params.set('q', options.q);
  if (options.sort) params.set('sort', options.sort);
  if (options.status) params.set('status', options.status);
  const qs = params.toString();
  return request<FormListResult>(`${ws(workspaceId)}${qs ? `?${qs}` : ''}`);
}

export function getForm(id: string, workspaceId = DEFAULT_WORKSPACE) {
  return request<Form>(`${ws(workspaceId)}/${id}`);
}

export class DemoWorkspaceError extends ApiError {
  constructor() {
    super(403, 'demo_workspace', 'This is a read-only demo workspace.');
  }
}

export function createForm(
  input: {
    name: string;
    title: string;
    description?: string;
    fields: FormField[];
    redirectUrl?: string;
    thankYouMessage?: string;
    hideHeader?: boolean;
    labelPlacement?: Form['labelPlacement'];
    submitLabel?: string;
    submitButtonSize?: Form['submitButtonSize'];
    submitButtonWidth?: Form['submitButtonWidth'];
    theme?: Form['theme'];
    steps?: Form['steps'];
    stepIndicator?: Form['stepIndicator'];
    showStepHeadings?: Form['showStepHeadings'];
    collectIp?: boolean;
    notifications?: Form['notifications'];
  },
  workspaceId = DEFAULT_WORKSPACE
) {
  return request<Form>(ws(workspaceId), { method: 'POST', body: JSON.stringify(input) });
}

export function updateForm(id: string, input: Partial<Form>, workspaceId = DEFAULT_WORKSPACE) {
  return request<Form>(`${ws(workspaceId)}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteForm(id: string, workspaceId = DEFAULT_WORKSPACE) {
  return request<void>(`${ws(workspaceId)}/${id}`, { method: 'DELETE' });
}

export function listSubmissions(
  id: string,
  workspaceId = DEFAULT_WORKSPACE,
  options: {
    page?: number;
    limit?: number;
    status?: 'all' | 'read' | 'unread' | 'starred';
    from?: string;
    to?: string;
  } = {}
) {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.status && options.status !== 'all') params.set('status', options.status);
  if (options.from) params.set('from', options.from);
  if (options.to) params.set('to', options.to);
  const qs = params.toString();
  return request<Paginated<Submission>>(`${ws(workspaceId)}/${id}/submissions${qs ? `?${qs}` : ''}`);
}

export function updateSubmission(
  formId: string,
  submissionId: string,
  patch: Partial<Pick<Submission, 'read' | 'starred'>>,
  workspaceId = DEFAULT_WORKSPACE
) {
  return request<Submission>(`${ws(workspaceId)}/${formId}/submissions/${submissionId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function deleteSubmission(formId: string, submissionId: string, workspaceId = DEFAULT_WORKSPACE) {
  return request<void>(`${ws(workspaceId)}/${formId}/submissions/${submissionId}`, { method: 'DELETE' });
}

export interface SourceBreakdownEntry {
  source: string;
  count: number;
}

export interface Analytics {
  viewCount: number;
  submissionCount: number;
  completionRate: number;
  sources: SourceBreakdownEntry[];
}

export function getAnalytics(id: string, workspaceId = DEFAULT_WORKSPACE) {
  return request<Analytics>(`${ws(workspaceId)}/${id}/analytics`);
}


/* ---- Public: reachable by form id alone, no workspace ---- */

export function getPublicForm(id: string) {
  return request<Form>(`/public/forms/${id}`);
}

export function recordView(id: string) {
  return request<void>(`/public/forms/${id}/view`, { method: 'POST' });
}

export function submitForm(id: string, data: Record<string, string>) {
  return request<Submission>(`/public/forms/${id}/submissions`, {
    method: 'POST',
    // `_hp` rides along in `data` when the honeypot got filled (a bot did
    // it — never a real respondent); otherwise it is simply absent.
    body: JSON.stringify(data),
  });
}

/** Uploads a respondent's file ahead of submission; the returned URL is what gets stored on the field. */
export async function uploadFormFile(
  formId: string,
  file: File,
  accept?: string
): Promise<{ url: string; name: string }> {
  const body = new FormData();
  body.append('file', file);
  // Server-side mirror of the field's own `accept` restriction — a respondent
  // editing the request by hand shouldn't bypass what the field type promises.
  if (accept) body.append('accept', accept);
  const res = await fetch(`${BASE_URL}/public/forms/${formId}/upload`, { method: 'POST', body });
  if (!res.ok) raise(await errorFrom(res));
  return res.json();
}

/** Uploads a theme background image for the editor. Workspace-scoped, unlike respondent uploads. */
export async function uploadBackgroundImage(
  file: File,
  workspaceId = DEFAULT_WORKSPACE
): Promise<{ url: string; name: string }> {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${BASE_URL}${ws(workspaceId)}/backgrounds`, { method: 'POST', body });
  if (!res.ok) raise(await errorFrom(res));
  return res.json();
}

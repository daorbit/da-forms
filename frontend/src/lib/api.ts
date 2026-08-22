import type { HealthResponse, Form, FormField, Submission, Paginated } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

/** The public, respondent-facing URL for a form's share link. */
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
    message: string
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error, body?.message ?? `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/**
 * Which workspace this app instance manages.
 *
 * Standalone it is a single built-in workspace; embedded in another product it
 * comes from the URL, so the host app's own workspace scopes the forms.
 */
export const DEFAULT_WORKSPACE = 'default';

function ws(workspaceId: string) {
  return `/workspaces/${encodeURIComponent(workspaceId)}/forms`;
}

export function getHealth() {
  return request<HealthResponse>('/health');
}

export function listForms(
  workspaceId = DEFAULT_WORKSPACE,
  options: { page?: number; limit?: number; q?: string; sort?: string } = {}
) {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.q) params.set('q', options.q);
  if (options.sort) params.set('sort', options.sort);
  const qs = params.toString();
  return request<Paginated<Form>>(`${ws(workspaceId)}${qs ? `?${qs}` : ''}`);
}

export function getForm(id: string, workspaceId = DEFAULT_WORKSPACE) {
  return request<Form>(`${ws(workspaceId)}/${id}`);
}

export function createForm(
  input: {
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
    collectIp?: boolean;
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

export interface Analytics {
  viewCount: number;
  submissionCount: number;
  completionRate: number;
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

export interface CaptchaChallenge {
  question: string;
  token: string;
}

export function getCaptcha(id: string) {
  return request<CaptchaChallenge>(`/public/forms/${id}/captcha`);
}

export function submitForm(
  id: string,
  data: Record<string, string>,
  captcha: { token: string; answer: string }
) {
  return request<Submission>(`/public/forms/${id}/submissions`, {
    method: 'POST',
    body: JSON.stringify({
      // `_hp` rides along in `data` when the honeypot got filled (a bot did
      // it — never a real respondent); otherwise it is simply absent.
      ...data,
      _captchaToken: captcha.token,
      _captchaAnswer: captcha.answer,
    }),
  });
}

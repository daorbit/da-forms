import type { HealthResponse, Form, FormField, Submission } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
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

export function listForms(workspaceId = DEFAULT_WORKSPACE) {
  return request<Form[]>(ws(workspaceId));
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

export function listSubmissions(id: string, workspaceId = DEFAULT_WORKSPACE) {
  return request<Submission[]>(`${ws(workspaceId)}/${id}/submissions`);
}

/* ---- Public: reachable by form id alone, no workspace ---- */

export function getPublicForm(id: string) {
  return request<Form>(`/public/forms/${id}`);
}

export function submitForm(id: string, data: Record<string, string>) {
  return request<Submission>(`/public/forms/${id}/submissions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

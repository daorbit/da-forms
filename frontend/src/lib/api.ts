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

export function getHealth() {
  return request<HealthResponse>('/health');
}

export function listForms(projectKey = 'default') {
  return request<Form[]>(`/forms?projectKey=${encodeURIComponent(projectKey)}`);
}

export function getForm(id: string) {
  return request<Form>(`/forms/${id}`);
}

export function createForm(input: {
  title: string;
  description?: string;
  fields: FormField[];
  projectKey?: string;
}) {
  return request<Form>('/forms', { method: 'POST', body: JSON.stringify(input) });
}

export function updateForm(id: string, input: Partial<Form>) {
  return request<Form>(`/forms/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteForm(id: string) {
  return request<void>(`/forms/${id}`, { method: 'DELETE' });
}

export function submitForm(id: string, data: Record<string, string>) {
  return request<Submission>(`/forms/${id}/submissions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function listSubmissions(id: string) {
  return request<Submission[]>(`/forms/${id}/submissions`);
}

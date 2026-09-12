import type {
  HealthResponse,
  Form,
  FormField,
  Submission,
  Paginated,
  PaymentRequired,
  PaymentSettings,
  RazorpayMode,
  PaymentProvider,
  ConnectionTestResult,
  AppCard,
  AppTestResult,
} from '@/types';
import { handlePlanLimit, type PlanLimitInfo } from './planLimit';
import type { GeneratedForm } from './generatedForm';
import { workspaceToken, refreshWorkspaceToken, ensureWorkspaceToken } from './workspaceToken';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export function publicFormPath(formId: string) {
  return `/form/${formId}/view`;
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

 
async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
  const needsToken = path.startsWith('/workspaces/');
 
  const token = needsToken ? await ensureWorkspaceToken() : '';
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(needsToken && token ? { authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const err = await errorFrom(res);
 
    if (err.code === 'workspace_token_expired' && needsToken && !isRetry) {
      const renewed = await refreshWorkspaceToken();
      if (renewed) return request<T>(path, init, true);
    }
    raise(err);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Kept as a distinct name where the token is the point of the call. */
const authedRequest = request;

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
 
export function generateFormDraft(
  prompt: string,
  workspaceId = DEFAULT_WORKSPACE,
 
  previous?: GeneratedForm,
 
  mode: 'create' | 'edit' = 'create'
) {
  return authedRequest<GeneratedForm>(`${ws(workspaceId)}/generate`, {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      ...(previous ? { previous } : {}),
      ...(mode === 'edit' ? { mode } : {}),
    }),
  });
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
    /** Free text, matched across every answer. */
    q?: string;
    /** Exact-match filters, keyed by field id. */
    fieldFilters?: Record<string, string>;
  } = {}
) {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.status && options.status !== 'all') params.set('status', options.status);
  if (options.from) params.set('from', options.from);
  if (options.to) params.set('to', options.to);
  if (options.q?.trim()) params.set('q', options.q.trim());

  for (const [fieldId, value] of Object.entries(options.fieldFilters ?? {})) {
    if (value) params.set(`f_${fieldId}`, value);
  }
  const qs = params.toString();
  return request<Paginated<Submission> & { retiredColumns: RetiredColumn[] }>(
    `${ws(workspaceId)}/${id}/submissions${qs ? `?${qs}` : ''}`
  );
}

export interface RetiredColumn {
  id: string;
  label: string;
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

export function bulkDeleteSubmissions(formId: string, submissionIds: string[], workspaceId = DEFAULT_WORKSPACE) {
  return request<{ deletedCount: number }>(`${ws(workspaceId)}/${formId}/submissions/bulk-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids: submissionIds }),
  });
}

export function bulkUpdateSubmissions(
  formId: string,
  submissionIds: string[],
  patch: Partial<Pick<Submission, 'read' | 'starred'>>,
  workspaceId = DEFAULT_WORKSPACE
) {
  return request<{ matchedCount: number }>(`${ws(workspaceId)}/${formId}/submissions/bulk-update`, {
    method: 'POST',
    body: JSON.stringify({ ids: submissionIds, ...patch }),
  });
}

export interface SourceBreakdownEntry {
  source: string;
  count: number;
}

export interface DropOffEntry {
  fieldId: string;
  index: number;
  abandoned: number;
}

export interface Analytics {
  viewCount: number;
  submissionCount: number;
  completionRate: number;
  sources: SourceBreakdownEntry[];
  /** Empty unless the form saves drafts — see `partialsEnabled`. */
  dropOff: DropOffEntry[];
  /**
   * Whether this form was recording where people stopped. Tells "nobody
   * abandoned it" apart from "we were not watching", which are the same empty
   * list otherwise.
   */
  partialsEnabled: boolean;
}

export function getAnalytics(id: string, workspaceId = DEFAULT_WORKSPACE) {
  return request<Analytics>(`${ws(workspaceId)}/${id}/analytics`);
}



export function getPublicForm(id: string) {
  return request<Form>(`/public/forms/${id}`);
}

export function recordView(id: string) {
  return request<void>(`/public/forms/${id}/view`, { method: 'POST' });
}

 
export function savePartial(
  id: string,
  data: Record<string, string>,
  partialKey: string,
  lastFieldId?: string,
  lastFieldIndex?: number
) {
  return request<void>(`/public/forms/${id}/partial`, {
    method: 'PUT',
    body: JSON.stringify({
      ...data,
      _partialKey: partialKey,
      _lastFieldId: lastFieldId,
      _lastFieldIndex: lastFieldIndex,
    }),
  });
}

/** The answers behind an edit link, so the form can open on what was sent. */
export function getSubmissionForEdit(id: string, token: string) {
  return request<{ data: Record<string, string>; fileMeta?: Record<string, { bytes: number }> }>(
    `/public/forms/${id}/edit?token=${encodeURIComponent(token)}`
  );
}

/** Replace a respondent's own answers, authorised by the token alone. */
export function updateSubmissionByToken(
  id: string,
  token: string,
  data: Record<string, string>
) {
  return request<{ ok: true }>(`/public/forms/${id}/edit`, {
    method: 'PUT',
    body: JSON.stringify({ ...data, _token: token }),
  });
}

/** Email the respondent a link back to the draft they are part-way through. */
export function emailResumeLink(id: string, partialKey: string, email: string) {
  return request<void>(`/public/forms/${id}/resume`, {
    method: 'POST',
    body: JSON.stringify({ _partialKey: partialKey, email }),
  });
}

/** The answers behind a resume link, so the form reopens where it was left. */
export function getPartialForResume(id: string, token: string) {
  return request<{ data: Record<string, string>; partialKey?: string }>(
    `/public/forms/${id}/resume?token=${encodeURIComponent(token)}`
  );
}

export interface UploadedFile {
  url: string;
  fieldLabel: string;
  submissionId: string;
  submittedAt: string;
}

 
export function listUploadedFiles(id: string, workspaceId = DEFAULT_WORKSPACE) {
  return request<{ files: UploadedFile[] }>(`${ws(workspaceId)}/${id}/files`);
}

export function duplicateForm(id: string, workspaceId = DEFAULT_WORKSPACE) {
  return request<Form>(`${ws(workspaceId)}/${id}/duplicate`, { method: 'POST' });
}

 
export function submitForm(id: string, data: Record<string, string>) {
  return request<Submission | PaymentRequired>(`/public/forms/${id}/submissions`, {
    method: 'POST',
 
    body: JSON.stringify(data),
  });
}

export function isPaymentRequired(
  result: Submission | PaymentRequired
): result is PaymentRequired {
  return (result as PaymentRequired).paymentRequired === true;
}

 
export function getPaymentStatus(formId: string, orderId: string) {
  return request<{ status: 'complete' | 'pending_payment'; paymentStatus: string }>(
    `/public/forms/${formId}/payments/${orderId}`
  );
}


export function getPaymentSettings(workspaceId = DEFAULT_WORKSPACE) {
  return authedRequest<PaymentSettings>(`/workspaces/${encodeURIComponent(workspaceId)}/settings/payments`);
}

export function savePaymentSettings(
  input: {
 
    provider?: PaymentProvider;
    defaultProvider?: PaymentProvider;
    enabled?: boolean;
    mode?: RazorpayMode;
    /** Which key set is being edited. Defaults to the active mode. */
    target?: RazorpayMode;
    keyId?: string;
    keySecret?: string;
    webhookSecret?: string;
  },
  workspaceId = DEFAULT_WORKSPACE
) {
  return authedRequest<PaymentSettings>(
    `/workspaces/${encodeURIComponent(workspaceId)}/settings/payments`,
    { method: 'PUT', body: JSON.stringify(input) }
  );
}

export function testPaymentConnection(
  mode: RazorpayMode,
  workspaceId = DEFAULT_WORKSPACE,
  provider: PaymentProvider = 'razorpay'
) {
  return authedRequest<ConnectionTestResult>(
    `/workspaces/${encodeURIComponent(workspaceId)}/settings/payments/test`,
    { method: 'POST', body: JSON.stringify({ mode, provider }) }
  );
}

export function disconnectPayments(
  mode: RazorpayMode,
  workspaceId = DEFAULT_WORKSPACE,
  provider: PaymentProvider = 'razorpay'
) {
  return authedRequest<PaymentSettings>(
    `/workspaces/${encodeURIComponent(workspaceId)}/settings/payments?mode=${mode}&provider=${provider}`,
    { method: 'DELETE' }
  );
}

/* ---- Workspace app connections (third-party integrations) ---- */

function appsBase(workspaceId: string) {
  return `/workspaces/${encodeURIComponent(workspaceId)}/settings/apps`;
}

export function listApps(workspaceId = DEFAULT_WORKSPACE) {
  return authedRequest<AppCard[]>(appsBase(workspaceId));
}

export function getApp(appId: string, workspaceId = DEFAULT_WORKSPACE) {
  return authedRequest<AppCard>(`${appsBase(workspaceId)}/${encodeURIComponent(appId)}`);
}

/**
 * Create or update one app connection.
 *
 * Only the fields in `values` are written; omit a secret key to keep the stored
 * one. `enabled` toggles the connection live — for email apps the server turns
 * the others off, since one mail transport is active at a time.
 */
export function saveApp(
  appId: string,
  input: { values: Record<string, unknown>; enabled?: boolean },
  workspaceId = DEFAULT_WORKSPACE
) {
  return authedRequest<AppCard>(`${appsBase(workspaceId)}/${encodeURIComponent(appId)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

 
export function testApp(appId: string, to?: string, workspaceId = DEFAULT_WORKSPACE) {
  return authedRequest<AppTestResult>(
    `${appsBase(workspaceId)}/${encodeURIComponent(appId)}/test`,
    { method: 'POST', body: JSON.stringify(to ? { to } : {}) }
  );
}

export function disconnectApp(appId: string, workspaceId = DEFAULT_WORKSPACE) {
  return authedRequest<AppCard[]>(`${appsBase(workspaceId)}/${encodeURIComponent(appId)}`, {
    method: 'DELETE',
  });
}

 
export function getWebhookApp(workspaceId = DEFAULT_WORKSPACE) {
  return authedRequest<{ enabled: boolean }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/settings/webhook-app`
  );
}

export function saveWebhookApp(enabled: boolean, workspaceId = DEFAULT_WORKSPACE) {
  return authedRequest<{ enabled: boolean }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/settings/webhook-app`,
    { method: 'PUT', body: JSON.stringify({ enabled }) }
  );
}

export async function uploadFormFile(
  formId: string,
  file: File,
  accept?: string
): Promise<{ url: string; name: string; bytes: number }> {
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
  // Workspace-scoped, so it carries the token like every other such call. No
  // Content-Type: the browser sets its own multipart boundary.
  const res = await fetch(`${BASE_URL}${ws(workspaceId)}/backgrounds`, {
    method: 'POST',
    body,
    headers: workspaceToken() ? { authorization: `Bearer ${workspaceToken()}` } : undefined,
  });
  if (!res.ok) raise(await errorFrom(res));
  return res.json();
}

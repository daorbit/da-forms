import type {
  HealthResponse,
  Form,
  FormField,
  Submission,
  Paginated,
  PaymentRequired,
  PaymentSettings,
  RazorpayMode,
  ConnectionTestResult,
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

/**
 * Every call, with the workspace token attached where the server wants one.
 *
 * Workspace-scoped routes need it: a workspace id travels in the URL and is no
 * kind of secret, so without proof of a session behind it anyone could point
 * the app at someone else's id and read their forms and responses.
 *
 * The public routes must not carry it — those are opened by respondents who
 * have no session at all, which is the entire point of a share link.
 */
async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
  const needsToken = path.startsWith('/workspaces/');
  // Asked for up front rather than after a rejection: the host loads this app
  // before it has handed one over, so the first workspace call would otherwise
  // always be a wasted round trip.
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
    // The token lasts an hour and the builder is a screen people leave open
    // for longer. Rather than fail the call, ask the host for a fresh one and
    // try again — once, so a host that cannot answer does not loop.
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

/**
 * Draft a form from a sentence.
 *
 * Nothing is stored by this call — the answer is a starting point the editor
 * opens, and it becomes a form only when the person saves it. Slower than every
 * other call here: two model attempts run behind it.
 */
export function generateFormDraft(
  prompt: string,
  workspaceId = DEFAULT_WORKSPACE,
  /** The draft being revised, when the prompt is a change rather than a first ask. */
  previous?: GeneratedForm,
  /**
   * "edit" — changing a form that already exists in the builder; the server
   * keeps fields and theme unless the prompt asks otherwise.
   * "create" (default) — a draft still being shaped in the generator modal.
   */
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

/**
 * A form with a payment field answers with `PaymentRequired` instead of a
 * submission — the response is stored but held back until Razorpay confirms.
 * Callers tell the two apart with `isPaymentRequired`.
 */
export function submitForm(id: string, data: Record<string, string>) {
  return request<Submission | PaymentRequired>(`/public/forms/${id}/submissions`, {
    method: 'POST',
    // `_hp` rides along in `data` when the honeypot got filled (a bot did
    // it — never a real respondent); otherwise it is simply absent.
    body: JSON.stringify(data),
  });
}

export function isPaymentRequired(
  result: Submission | PaymentRequired
): result is PaymentRequired {
  return (result as PaymentRequired).paymentRequired === true;
}

/**
 * Whether a payment has landed yet.
 *
 * Polled after checkout closes: the webhook is what completes the submission,
 * and it can arrive a moment after the browser does.
 */
export function getPaymentStatus(formId: string, orderId: string) {
  return request<{ status: 'complete' | 'pending_payment'; paymentStatus: string }>(
    `/public/forms/${formId}/payments/${orderId}`
  );
}

/* ---- Workspace payment settings ---- */

export function getPaymentSettings(workspaceId = DEFAULT_WORKSPACE) {
  return authedRequest<PaymentSettings>(`/workspaces/${encodeURIComponent(workspaceId)}/settings/payments`);
}

export function savePaymentSettings(
  input: {
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

/** Asks Razorpay whether the saved keys work, so a wrong one is caught here. */
export function testPaymentConnection(mode: RazorpayMode, workspaceId = DEFAULT_WORKSPACE) {
  return authedRequest<ConnectionTestResult>(
    `/workspaces/${encodeURIComponent(workspaceId)}/settings/payments/test`,
    { method: 'POST', body: JSON.stringify({ mode }) }
  );
}

export function disconnectPayments(mode: RazorpayMode, workspaceId = DEFAULT_WORKSPACE) {
  return authedRequest<PaymentSettings>(
    `/workspaces/${encodeURIComponent(workspaceId)}/settings/payments?mode=${mode}`,
    { method: 'DELETE' }
  );
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

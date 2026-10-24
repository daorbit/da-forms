import { STATUS_CODES } from 'node:http';
import { escapeHtml } from './emailTemplates.js';
import type { OpsAlert, OpsAlertField } from './quantalog.js';

export const SERVICE = 'Forms API';
export const MAX_DETAIL = 1500;

export interface ServerResponseContext {
  method: string;
  path: string;
  route?: string;
  message?: string;
  durationMs?: number;
  requestId?: string;
}

export function withoutQuery(path: string): string {
  return path.split('?')[0];
}

export function routeShape(path: string): string {
  return withoutQuery(path)
    .split('/')
    .map((part) => (/^[0-9a-f]{24}$/i.test(part) || /^\d+$/.test(part) ? ':id' : part))
    .join('/');
}

export function areaOf(path: string): string {
  const parts = withoutQuery(path).split('/').filter(Boolean);
  if (parts[0] === 'api') parts.shift();
  if (parts[0] === 'workspaces' && parts.length > 2) return `workspaces · ${parts[2]}`;
  if (parts[0] === 'public' && parts[1]) return `public · ${parts[1]}`;
  return parts[0] ?? 'root';
}

export function workspaceOf(path: string): string | undefined {
  return /\/workspaces\/([0-9a-f]{24})/i.exec(path)?.[1];
}

export function statusLabel(status: number): string {
  const text = STATUS_CODES[status];
  return text ? `${status} ${text}` : String(status);
}

export function firstAppFrame(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  const frame = stack
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('at ') && !line.includes('node_modules') && !line.includes('node:'));
  return frame?.replace(/^at /, '').replace(/\(?file:\/\/\/?.*?\/(src|dist)\//, '($1/');
}

export function presentFields(entries: [string, string | number | undefined][]): OpsAlertField[] {
  return entries
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([label, value]) => ({ label, value: String(value) }));
}

export function cooldownKey(alert: OpsAlert): string {
  return `${alert.title}|${alert.where}|${alert.detail.slice(0, 120).replace(/[0-9a-f]{24}/gi, ':id').replace(/\d+/g, '#')}`;
}

export function opsAlertLogLine(alert: OpsAlert): string {
  const extra = (alert.fields ?? []).map((f) => `${f.label}=${f.value}`).join(' ');
  return `[ops-alert] ${SERVICE} | ${alert.title} | ${alert.where} | ${alert.detail}${extra ? ` | ${extra}` : ''}`;
}

export function renderDirectAlert(alert: OpsAlert, footer: { environment: string; sentAt: Date }): string {
  return [
    `<b>${SERVICE} · ${escapeHtml(alert.title)}</b>`,
    '',
    `<b>Where:</b> <code>${escapeHtml(alert.where)}</code>`,
    `<b>Issue:</b> ${escapeHtml(alert.detail)}`,
    ...(alert.fields ?? []).map((f) => `<b>${escapeHtml(f.label)}:</b> <code>${escapeHtml(f.value)}</code>`),
    '',
    `<i>${escapeHtml(footer.environment)} · sent directly, Quantalog relay failed · ${footer.sentAt.toISOString()}</i>`,
  ].join('\n');
}

export function serverErrorAlert(err: unknown, method: string, path: string): OpsAlert {
  const e = err as { name?: string; message?: string; stack?: string; code?: unknown } | null;
  return {
    title: 'Unhandled error · 500 Internal Server Error',
    where: `${method} ${routeShape(path)}`,
    detail: `${e?.name ?? 'Error'}: ${e?.message ?? String(err)}`.slice(0, MAX_DETAIL),
    fields: presentFields([
      ['Area', areaOf(path)],
      ['Path', withoutQuery(path)],
      ['Code', typeof e?.code === 'string' || typeof e?.code === 'number' ? e.code : undefined],
      ['Thrown at', firstAppFrame(e?.stack)],
      ['Workspace', workspaceOf(path)],
    ]),
  };
}

export function serverResponseAlert(status: number, context: ServerResponseContext): OpsAlert {
  return {
    title: `Request failed · ${statusLabel(status)}`,
    where: `${context.method} ${routeShape(context.route ?? context.path)}`,
    detail: (context.message || 'The endpoint answered with an error status but no error message.').slice(0, MAX_DETAIL),
    fields: presentFields([
      ['Area', areaOf(context.path)],
      ['Path', withoutQuery(context.path)],
      ['Workspace', workspaceOf(context.path)],
      ['Took', context.durationMs !== undefined ? `${context.durationMs} ms` : undefined],
      ['Vercel request', context.requestId],
    ]),
  };
}

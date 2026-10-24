import { STATUS_CODES } from 'node:http';
import { escapeHtml } from './emailTemplates.js';
import { TELEGRAM_TOKEN } from './chatAlert.js';
import { relayOpsAlert, type OpsAlert, type OpsAlertField } from './quantalog.js';

const SERVICE = 'Forms API';
const COOLDOWN_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 6_000;
const MAX_TRACKED = 500;
const MAX_DETAIL = 1500;

export interface ServerResponseContext {
  method: string;
  path: string;
  route?: string;
  message?: string;
  durationMs?: number;
  requestId?: string;
}

const lastSent = new Map<string, number>();

function environment(): string {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development';
}

function fallbackTarget(): { token: string; chatId: string } | null {
  const token = process.env.OPS_ALERT_TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.OPS_ALERT_TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId || !TELEGRAM_TOKEN.test(token)) return null;
  return { token, chatId };
}

function withoutQuery(path: string): string {
  return path.split('?')[0];
}

function routeShape(path: string): string {
  return withoutQuery(path)
    .split('/')
    .map((part) => (/^[0-9a-f]{24}$/i.test(part) || /^\d+$/.test(part) ? ':id' : part))
    .join('/');
}

function areaOf(path: string): string {
  const parts = withoutQuery(path).split('/').filter(Boolean);
  if (parts[0] === 'api') parts.shift();
  if (parts[0] === 'workspaces' && parts.length > 2) return `workspaces · ${parts[2]}`;
  if (parts[0] === 'public' && parts[1]) return `public · ${parts[1]}`;
  return parts[0] ?? 'root';
}

function workspaceOf(path: string): string | undefined {
  return /\/workspaces\/([0-9a-f]{24})/i.exec(path)?.[1];
}

export function statusLabel(status: number): string {
  const text = STATUS_CODES[status];
  return text ? `${status} ${text}` : String(status);
}

function firstAppFrame(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  const frame = stack
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('at ') && !line.includes('node_modules') && !line.includes('node:'));
  return frame?.replace(/^at /, '').replace(/\(?file:\/\/\/?.*?\/(src|dist)\//, '($1/');
}

function present(entries: [string, string | number | undefined][]): OpsAlertField[] {
  return entries
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([label, value]) => ({ label, value: String(value) }));
}

function coolingDown(key: string): boolean {
  const now = Date.now();
  const last = lastSent.get(key);
  if (last && now - last < COOLDOWN_MS) return true;
  if (lastSent.size >= MAX_TRACKED) lastSent.clear();
  lastSent.set(key, now);
  return false;
}

function logLine(alert: OpsAlert): string {
  const extra = (alert.fields ?? []).map((f) => `${f.label}=${f.value}`).join(' ');
  return `[ops-alert] ${SERVICE} | ${alert.title} | ${alert.where} | ${alert.detail}${extra ? ` | ${extra}` : ''}`;
}

async function sendDirect(alert: OpsAlert): Promise<void> {
  const target = fallbackTarget();
  if (!target) {
    console.warn('[ops-alert] not sent: Quantalog relay failed and OPS_ALERT_TELEGRAM_* is not set');
    return;
  }

  const text = [
    `<b>${SERVICE} · ${escapeHtml(alert.title)}</b>`,
    '',
    `<b>Where:</b> <code>${escapeHtml(alert.where)}</code>`,
    `<b>Issue:</b> ${escapeHtml(alert.detail)}`,
    ...(alert.fields ?? []).map((f) => `<b>${escapeHtml(f.label)}:</b> <code>${escapeHtml(f.value)}</code>`),
    '',
    `<i>${escapeHtml(environment())} · sent directly, Quantalog relay failed · ${new Date().toISOString()}</i>`,
  ].join('\n');

  const res = await fetch(`https://api.telegram.org/bot${target.token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: target.chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) console.error(`[ops-alert] telegram send failed: HTTP ${res.status}`);
}

async function send(alert: OpsAlert): Promise<void> {
  console.error(logLine(alert));
  if (coolingDown(`${alert.title}|${alert.where}|${alert.detail.slice(0, 120).replace(/\d+/g, '#')}`)) return;
  if (await relayOpsAlert(alert)) return;
  await sendDirect(alert);
}

export function alertServerError(err: unknown, method: string, path: string): Promise<void> {
  const e = err as { name?: string; message?: string; stack?: string; code?: unknown } | null;
  return send({
    title: 'Unhandled error · 500 Internal Server Error',
    where: `${method} ${routeShape(path)}`,
    detail: `${e?.name ?? 'Error'}: ${e?.message ?? String(err)}`.slice(0, MAX_DETAIL),
    fields: present([
      ['Area', areaOf(path)],
      ['Path', withoutQuery(path)],
      ['Code', typeof e?.code === 'string' || typeof e?.code === 'number' ? e.code : undefined],
      ['Thrown at', firstAppFrame(e?.stack)],
      ['Workspace', workspaceOf(path)],
    ]),
  });
}

export function alertServerResponse(status: number, context: ServerResponseContext): Promise<void> {
  return send({
    title: `Request failed · ${statusLabel(status)}`,
    where: `${context.method} ${context.route ?? routeShape(context.path)}`,
    detail: (context.message || 'The endpoint answered with an error status but no error message.').slice(0, MAX_DETAIL),
    fields: present([
      ['Area', areaOf(context.path)],
      ['Path', withoutQuery(context.path)],
      ['Workspace', workspaceOf(context.path)],
      ['Took', context.durationMs !== undefined ? `${context.durationMs} ms` : undefined],
      ['Vercel request', context.requestId],
    ]),
  });
}

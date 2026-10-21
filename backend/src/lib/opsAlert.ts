import { escapeHtml } from './emailTemplates.js';
import { TELEGRAM_TOKEN } from './chatAlert.js';
import { relayOpsAlert, type OpsAlert } from './quantalog.js';

const SERVICE = 'Forms API';
const COOLDOWN_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 6_000;
const MAX_TRACKED = 500;
const MAX_DETAIL = 1500;

const lastSent = new Map<string, number>();

function fallbackTarget(): { token: string; chatId: string } | null {
  const token = process.env.OPS_ALERT_TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.OPS_ALERT_TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId || !TELEGRAM_TOKEN.test(token)) return null;
  return { token, chatId };
}

function routeShape(path: string): string {
  return path
    .split('?')[0]
    .split('/')
    .map((part) => (/^[0-9a-f]{24}$/i.test(part) || /^\d+$/.test(part) ? ':id' : part))
    .join('/');
}

function coolingDown(key: string): boolean {
  const now = Date.now();
  const last = lastSent.get(key);
  if (last && now - last < COOLDOWN_MS) return true;
  if (lastSent.size >= MAX_TRACKED) lastSent.clear();
  lastSent.set(key, now);
  return false;
}

async function sendDirect(alert: OpsAlert): Promise<void> {
  const target = fallbackTarget();
  if (!target) return;

  const text = [
    `<b>${SERVICE} · ${escapeHtml(alert.title)}</b>`,
    `<code>${escapeHtml(alert.where)}</code>`,
    escapeHtml(alert.detail),
    `<i>${escapeHtml(process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development')} · ${new Date().toISOString()}</i>`,
  ].join('\n');

  const res = await fetch(`https://api.telegram.org/bot${target.token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: target.chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) console.error(`[ops-alert] telegram send failed: HTTP ${res.status}`);
}

export async function alertServerError(err: unknown, method: string, path: string): Promise<void> {
  const e = err as { name?: string; message?: string } | null;
  const alert: OpsAlert = {
    title: 'Server error',
    where: `${method} ${routeShape(path)}`,
    detail: `${e?.name ?? 'Error'}: ${e?.message ?? String(err)}`.slice(0, MAX_DETAIL),
  };
  if (coolingDown(`${alert.where}|${alert.detail.slice(0, 120).replace(/\d+/g, '#')}`)) return;
  if (await relayOpsAlert(alert)) return;
  await sendDirect(alert);
}

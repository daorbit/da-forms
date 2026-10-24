import { TELEGRAM_TOKEN } from './chatAlert.js';
import { relayOpsAlert, type OpsAlert } from './quantalog.js';
import {
  cooldownKey,
  opsAlertLogLine,
  renderDirectAlert,
  serverErrorAlert,
  serverResponseAlert,
  type ServerResponseContext,
} from './opsAlertFormat.js';

const COOLDOWN_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 6_000;
const MAX_TRACKED = 500;

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
  if (!target) {
    console.warn('[ops-alert] not sent: Quantalog relay failed and OPS_ALERT_TELEGRAM_* is not set');
    return;
  }

  const text = renderDirectAlert(alert, { environment: environment(), sentAt: new Date() });
  const res = await fetch(`https://api.telegram.org/bot${target.token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: target.chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) console.error(`[ops-alert] telegram send failed: HTTP ${res.status}`);
}

async function send(alert: OpsAlert): Promise<void> {
  console.error(opsAlertLogLine(alert));
  if (coolingDown(cooldownKey(alert))) return;
  if (await relayOpsAlert(alert)) return;
  await sendDirect(alert);
}

export function alertServerError(err: unknown, method: string, path: string): Promise<void> {
  return send(serverErrorAlert(err, method, path));
}

export function alertServerResponse(status: number, context: ServerResponseContext): Promise<void> {
  return send(serverResponseAlert(status, context));
}

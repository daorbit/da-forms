import type { AppId } from '../models/appConnection.model.js';

const TIMEOUT_MS = 6_000;
const MAX_FIELDS = 12;
const MAX_VALUE = 300;
const TELEGRAM_MAX_TEXT = 4000;

const ALLOWED_HOSTS: Record<string, RegExp> = {
  slack: /^hooks\.slack\.com$/,
  discord: /^(?:discord|discordapp)\.com$/,
  teams: /(?:^|\.)(?:logic\.azure\.com|powerplatform\.com|powerautomate\.com|webhook\.office\.com)$/,
};

export const TELEGRAM_TOKEN = /^\d{5,15}:[A-Za-z0-9_-]{30,64}$/;
const TELEGRAM_CHAT = /^(?:-?\d{1,20}|@[A-Za-z][A-Za-z0-9_]{4,31})$/;

const WEBHOOK_STATUS_HINT: Record<number, string> = {
  400: 'rejected the message. Check that the webhook URL was copied in full.',
  401: 'refused the webhook. Create a new webhook and paste its URL.',
  403: 'refused the webhook. It may have been revoked, or the channel is archived. Create a new one and paste its URL.',
  404: 'could not find this webhook. It was deleted or the URL is incomplete. Create a new one and paste its URL.',
  410: 'says this webhook was removed. Create a new one and paste its URL.',
  429: 'is rate limiting messages right now. Try again in a minute.',
};

const APP_NAME: Record<string, string> = { slack: 'Slack', discord: 'Discord', teams: 'Microsoft Teams' };

export interface ChatAlert {
  title: string;
  answers: { label: string; value: string }[];
}

export interface ChatConnection {
  appId: AppId;
  config: Record<string, unknown>;
  secrets: Record<string, string>;
}

export function isValidChatUrl(appId: string, raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && Boolean(ALLOWED_HOSTS[appId]?.test(url.hostname));
  } catch {
    return false;
  }
}

export function isValidChatSecret(appId: string, raw: string): boolean {
  return isValidChatUrl(appId, raw);
}

function clip(value: string): string {
  return value.length > MAX_VALUE ? `${value.slice(0, MAX_VALUE)}…` : value;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function teamsCard(title: string, answers: ChatAlert['answers']): unknown {
  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            { type: 'TextBlock', text: title, weight: 'Bolder', size: 'Medium', wrap: true },
            {
              type: 'FactSet',
              facts: answers.map((a) => ({ title: clip(a.label).slice(0, 250), value: clip(a.value) || '-' })),
            },
          ],
        },
      },
    ],
  };
}

function webhookBody(appId: string, alert: ChatAlert): unknown {
  const answers = alert.answers.slice(0, MAX_FIELDS);
  if (appId === 'teams') return teamsCard(alert.title, answers);
  if (appId === 'discord') {
    return {
      embeds: [
        {
          title: alert.title,
          fields: answers.map((a) => ({ name: clip(a.label).slice(0, 250), value: clip(a.value) || '-' })),
        },
      ],
    };
  }
  const lines = answers.map((a) => `*${a.label}:* ${clip(a.value)}`);
  return { text: `${alert.title}\n${lines.join('\n')}` };
}

function telegramText(alert: ChatAlert): string {
  const lines = alert.answers
    .slice(0, MAX_FIELDS)
    .map((a) => `<b>${escapeHtml(clip(a.label))}:</b> ${escapeHtml(clip(a.value))}`);
  const text = [`<b>${escapeHtml(alert.title)}</b>`, ...lines].join('\n');
  return text.length > TELEGRAM_MAX_TEXT ? `${text.slice(0, TELEGRAM_MAX_TEXT)}…` : text;
}

async function postTelegram(connection: ChatConnection, alert: ChatAlert): Promise<void> {
  const token = String(connection.secrets.botToken ?? '');
  const chatId = String(connection.config.chatId ?? '');
  if (!TELEGRAM_TOKEN.test(token) || !TELEGRAM_CHAT.test(chatId)) {
    throw new Error('Save a valid bot token and chat ID first.');
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: telegramText(alert),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.ok) return;
  const body = (await res.json().catch(() => null)) as { description?: string } | null;
  throw new Error(body?.description ? `Telegram: ${body.description}` : `Telegram returned HTTP ${res.status}`);
}

async function postWebhook(appId: AppId, url: string, alert: ChatAlert): Promise<void> {
  if (!isValidChatUrl(appId, url)) throw new Error('The webhook URL is not a valid address for this app.');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhookBody(appId, alert)),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.ok) return;
  const name = APP_NAME[appId] ?? appId;
  const hint = WEBHOOK_STATUS_HINT[res.status];
  throw new Error(hint ? `${name} ${hint}` : `${name} returned HTTP ${res.status}. Try again, or create a new webhook.`);
}

export function sendChatAlert(connection: ChatConnection, alert: ChatAlert): Promise<void> {
  if (connection.appId === 'telegram') return postTelegram(connection, alert);
  return postWebhook(connection.appId, String(connection.secrets.webhookUrl ?? ''), alert);
}

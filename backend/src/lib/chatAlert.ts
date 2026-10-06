import type { AppId } from '../models/appConnection.model.js';

const TIMEOUT_MS = 6_000;
const MAX_FIELDS = 12;
const MAX_VALUE = 300;

const ALLOWED_HOSTS: Record<string, RegExp> = {
  slack: /^hooks\.slack\.com$/,
  discord: /^(?:discord|discordapp)\.com$/,
};

export interface ChatAlert {
  title: string;
  answers: { label: string; value: string }[];
}

export function isValidChatUrl(appId: string, raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && Boolean(ALLOWED_HOSTS[appId]?.test(url.hostname));
  } catch {
    return false;
  }
}

function clip(value: string): string {
  return value.length > MAX_VALUE ? `${value.slice(0, MAX_VALUE)}…` : value;
}

function bodyFor(appId: string, alert: ChatAlert): unknown {
  const answers = alert.answers.slice(0, MAX_FIELDS);
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

export async function postChatAlert(appId: AppId, url: string, alert: ChatAlert): Promise<void> {
  if (!isValidChatUrl(appId, url)) throw new Error('The webhook URL is not a valid address for this app.');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyFor(appId, alert)),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${appId} returned HTTP ${res.status}`);
}

import { AppConnectionModel } from '../models/appConnection.model.js';
import { decrypt } from '../lib/crypto.js';
import { sendChatAlert, type ChatAlert, type ChatConnection } from '../lib/chatAlert.js';
import { importTelegramBot, sendTelegramAlert } from '../lib/quantalog.js';

interface LegacyTelegramDoc {
  enabled?: boolean;
  config?: Record<string, unknown>;
  secrets?: Record<string, string>;
}

function readToken(doc: LegacyTelegramDoc): string {
  try {
    return decrypt(doc.secrets?.botToken ?? '');
  } catch {
    return '';
  }
}

async function moveLegacyConnection(workspaceId: string): Promise<ChatConnection | null> {
  const doc = await AppConnectionModel.findOne({ workspaceId, appId: 'telegram' })
    .select('enabled config secrets')
    .lean<LegacyTelegramDoc>();
  if (!doc) return null;

  const botToken = readToken(doc);
  const chatId = String(doc.config?.chatId ?? '');
  if (!botToken || !chatId) {
    await AppConnectionModel.deleteOne({ workspaceId, appId: 'telegram' });
    return null;
  }

  const outcome = await importTelegramBot(workspaceId, botToken, chatId, Boolean(doc.enabled));
  if (outcome === 'imported') {
    await AppConnectionModel.deleteOne({ workspaceId, appId: 'telegram' });
    return null;
  }
  return doc.enabled ? { appId: 'telegram', config: doc.config ?? {}, secrets: { botToken } } : null;
}

export async function sendTelegramAlerts(workspaceId: string, alert: ChatAlert): Promise<void> {
  const legacy = await moveLegacyConnection(workspaceId);
  const jobs: Promise<void>[] = [sendTelegramAlert(workspaceId, alert)];
  if (legacy) jobs.push(sendChatAlert(legacy, alert));
  const results = await Promise.allSettled(jobs);
  for (const result of results) {
    if (result.status === 'rejected') console.error('[notifications] failed to post Telegram alert:', result.reason);
  }
}

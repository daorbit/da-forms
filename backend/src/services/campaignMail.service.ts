import { getDescriptor } from '../lib/app-catalog.js';
import { sendMail } from '../lib/mailer.js';
import { resolveEmailConnection } from './appConnection.service.js';

const MAX_MESSAGES = 50;
const CONCURRENCY = 4;

export interface BatchMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

export interface BatchResult {
  to: string;
  ok: boolean;
  error?: string;
}

export async function emailStatus(workspaceId: string) {
  const connection = await resolveEmailConnection(workspaceId);
  if (!connection) return { connected: false as const };
  return {
    connected: true as const,
    provider: connection.appId,
    providerName: getDescriptor(connection.appId)?.name ?? connection.appId,
    fromEmail: String(connection.config.fromEmail ?? ''),
  };
}

function readMessages(body: unknown): BatchMessage[] {
  const raw = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_MESSAGES).filter((message): message is BatchMessage => {
    const m = message as Partial<BatchMessage> | null;
    return Boolean(m && typeof m.to === 'string' && typeof m.subject === 'string' && typeof m.html === 'string' && typeof m.text === 'string');
  });
}

async function sendOne(workspaceId: string, message: BatchMessage): Promise<BatchResult> {
  try {
    await sendMail(workspaceId, message.to, message.subject, message.html, message.text, [], message.headers);
    return { to: message.to, ok: true };
  } catch (err) {
    return { to: message.to, ok: false, error: err instanceof Error ? err.message.slice(0, 300) : 'send failed' };
  }
}

export async function sendEmailBatch(workspaceId: string, body: unknown): Promise<BatchResult[]> {
  const messages = readMessages(body);
  const results: BatchResult[] = [];
  for (let i = 0; i < messages.length; i += CONCURRENCY) {
    const group = messages.slice(i, i + CONCURRENCY);
    results.push(...(await Promise.all(group.map((message) => sendOne(workspaceId, message)))));
  }
  return results;
}

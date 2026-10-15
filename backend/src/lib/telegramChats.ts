import { TELEGRAM_TOKEN } from './chatAlert.js';

const TIMEOUT_MS = 6_000;
const MAX_CHATS = 20;

export interface TelegramChat {
  id: string;
  title: string;
  type: string;
}

export interface TelegramChatList {
  botUsername?: string;
  chats: TelegramChat[];
}

interface RawChat {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface RawUpdate {
  message?: { chat: RawChat };
  edited_message?: { chat: RawChat };
  channel_post?: { chat: RawChat };
  my_chat_member?: { chat: RawChat };
}

interface TelegramResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

export class TelegramLookupError extends Error {}

async function call<T>(token: string, method: string): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = (await res.json().catch(() => null)) as TelegramResponse<T> | null;
  if (res.status === 401 || res.status === 404) {
    throw new TelegramLookupError('Telegram does not recognise this bot token. Copy it again from @BotFather.');
  }
  if (res.status === 409) {
    throw new TelegramLookupError(
      'This bot has a webhook set, so Telegram will not list its chats. Paste the chat ID by hand instead.'
    );
  }
  if (!body?.ok || body.result === undefined) {
    throw new TelegramLookupError(body?.description ? `Telegram: ${body.description}` : `Telegram returned HTTP ${res.status}`);
  }
  return body.result;
}

function chatTitle(chat: RawChat): string {
  if (chat.title) return chat.title;
  const name = [chat.first_name, chat.last_name].filter(Boolean).join(' ');
  if (name) return name;
  return chat.username ? `@${chat.username}` : String(chat.id);
}

function chatsFrom(updates: RawUpdate[]): TelegramChat[] {
  const byId = new Map<string, TelegramChat>();
  for (const update of [...updates].reverse()) {
    const chat =
      update.message?.chat ?? update.edited_message?.chat ?? update.channel_post?.chat ?? update.my_chat_member?.chat;
    if (!chat) continue;
    const id = String(chat.id);
    if (!byId.has(id)) byId.set(id, { id, title: chatTitle(chat), type: chat.type });
    if (byId.size >= MAX_CHATS) break;
  }
  return [...byId.values()];
}

export async function findTelegramChats(token: string): Promise<TelegramChatList> {
  if (!TELEGRAM_TOKEN.test(token)) {
    throw new TelegramLookupError('That does not look like a bot token. It should look like 123456789:AAH…');
  }
  const [me, updates] = await Promise.all([
    call<{ username?: string }>(token, 'getMe'),
    call<RawUpdate[]>(token, 'getUpdates'),
  ]);
  return { botUsername: me.username, chats: chatsFrom(updates) };
}

import { Settings2Icon } from 'lucide-react';
import { openConnections } from '@/lib/hostConnections';
import type { TelegramSummary } from '@/types';
import { ChannelStatus } from './ChannelStatus';

interface Props {
  summary: TelegramSummary | null;
  failed: boolean;
  onRetry: () => void;
}

function describe(summary: TelegramSummary): { ok: boolean; text: string; label: string } {
  if (!summary.connected) return { ok: false, text: 'Telegram is not connected yet.', label: 'Connect' };
  if (!summary.alertChats) return { ok: false, text: 'No chat has form alerts on.', label: 'Choose chats' };
  const chats = `${summary.alertChats} chat${summary.alertChats === 1 ? '' : 's'}`;
  return { ok: true, text: summary.sender ? `Posts to ${chats} as ${summary.sender}` : `Posts to ${chats}`, label: 'Manage' };
}

export function TelegramConnectionStatus({ summary, failed, onRetry }: Props) {
  const info = summary ? describe(summary) : null;
  return (
    <ChannelStatus
      loading={!summary}
      failed={failed}
      ok={Boolean(info?.ok)}
      text={info?.text ?? ''}
      action={
        info
          ? { label: info.label, icon: <Settings2Icon size={13} />, onClick: () => openConnections('telegram') }
          : undefined
      }
      onRetry={onRetry}
    />
  );
}

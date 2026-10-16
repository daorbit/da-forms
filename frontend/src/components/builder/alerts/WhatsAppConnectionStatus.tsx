import { ArrowUpRightIcon, Settings2Icon } from 'lucide-react';
import { openConnections } from '@/lib/hostConnections';
import { requestUpgrade } from '@/lib/planLimit';
import type { WhatsAppSummary } from '@/types';
import { ChannelStatus, type ChannelAction } from './ChannelStatus';

interface Props {
  summary: WhatsAppSummary | null;
  failed: boolean;
  onRetry: () => void;
}

const MANAGE = (label: string): ChannelAction => ({
  label,
  icon: <Settings2Icon size={13} />,
  onClick: () => openConnections('whatsapp'),
});

function describe(summary: WhatsAppSummary): { ok: boolean; text: string; action?: ChannelAction } {
  if (!summary.available) return { ok: false, text: 'WhatsApp alerts are not available right now.' };
  if (!summary.entitled) {
    return {
      ok: false,
      text: `WhatsApp alerts are not on the ${summary.planName ?? 'current'} plan.`,
      action: { label: 'Upgrade', icon: <ArrowUpRightIcon size={13} />, onClick: requestUpgrade },
    };
  }
  if (!summary.enabled) return { ok: false, text: 'WhatsApp is not connected yet.', action: MANAGE('Connect') };
  if (!summary.alertNumbers) return { ok: false, text: 'No number has form alerts on.', action: MANAGE('Choose numbers') };
  const numbers = `${summary.alertNumbers} number${summary.alertNumbers === 1 ? '' : 's'}`;
  return { ok: true, text: `Sends to ${numbers}`, action: MANAGE('Manage') };
}

export function WhatsAppConnectionStatus({ summary, failed, onRetry }: Props) {
  const info = summary ? describe(summary) : null;
  return (
    <ChannelStatus
      loading={!summary}
      failed={failed}
      ok={Boolean(info?.ok)}
      text={info?.text ?? ''}
      action={info?.action}
      onRetry={onRetry}
    />
  );
}

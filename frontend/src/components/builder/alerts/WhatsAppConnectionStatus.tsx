import { ArrowUpRightIcon, SmartphoneIcon } from 'lucide-react';
import { openProfileSettings } from '@/lib/hostConnections';
import { requestUpgrade } from '@/lib/planLimit';
import type { WhatsAppSummary } from '@/types';
import { ChannelStatus, type ChannelAction } from './ChannelStatus';

interface Props {
  summary: WhatsAppSummary | null;
  failed: boolean;
  onRetry: () => void;
}

function describe(summary: WhatsAppSummary): { ok: boolean; text: string; action?: ChannelAction } {
  if (!summary.configured) return { ok: false, text: 'WhatsApp alerts are not available right now.' };
  if (!summary.entitled) {
    return {
      ok: false,
      text: `WhatsApp alerts are not on the ${summary.planName ?? 'current'} plan.`,
      action: { label: 'Upgrade', icon: <ArrowUpRightIcon size={13} />, onClick: requestUpgrade },
    };
  }
  if (!summary.mobileHint) {
    return {
      ok: false,
      text: "The workspace owner hasn't added a mobile number.",
      action: { label: 'Add number', icon: <SmartphoneIcon size={13} />, onClick: openProfileSettings },
    };
  }
  return { ok: true, text: `Sends to the owner's WhatsApp, ${summary.mobileHint}` };
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

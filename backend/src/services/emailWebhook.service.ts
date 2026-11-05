import { reportEmailSuppressions, type EmailSuppressionReason } from '../lib/quantalog.js';
import { verifySvixSignature, type SvixHeaders } from '../lib/svix-signature.js';
import { resolveConnection } from './appConnection.service.js';

interface ResendEvent {
  type?: string;
  data?: { to?: unknown; bounce?: { type?: string } };
}

function reasonFor(event: ResendEvent): EmailSuppressionReason | null {
  if (event.type === 'email.complained') return 'complained';
  if (event.type === 'email.bounced' && event.data?.bounce?.type === 'Permanent') return 'bounced';
  return null;
}

function addressesOf(event: ResendEvent): string[] {
  const to = event.data?.to;
  return Array.isArray(to) ? to.filter((value): value is string => typeof value === 'string') : [];
}

export async function handleResendWebhook(
  workspaceId: string,
  rawBody: string,
  headers: SvixHeaders
): Promise<'handled' | 'rejected'> {
  const connection = await resolveConnection(workspaceId, 'resend');
  const secret = connection?.secrets.webhookSecret ?? '';
  if (!verifySvixSignature(secret, headers, rawBody)) return 'rejected';

  const event = JSON.parse(rawBody) as ResendEvent;
  const reason = reasonFor(event);
  const emails = addressesOf(event);
  if (reason && emails.length) await reportEmailSuppressions(workspaceId, emails, reason);
  return 'handled';
}

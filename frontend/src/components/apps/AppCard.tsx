import { Button, Card, Text } from '@mantine/core';
import { IconPlugConnected, IconSettings } from '@tabler/icons-react';
import { StatusPill } from '@/components/ui/StatusPill';
import { relativeTime } from '@/lib/relativeTime';
import classes from './apps.module.css';
import type { AppCard as AppCardData } from '@/types';
import { AppLogo, isWordmark } from './AppLogos';

/** A payment gateway shown as a card — state comes from the payment settings, not `listApps`. */
export interface PaymentCardData {
  kind: 'payment';
  id: string;
  name: string;
  category: 'payments';
  description: string;
  connected: boolean;
  enabled: boolean;
}

 
export interface WebhookCardData {
  kind: 'webhook';
  id: 'webhook';
  name: string;
  category: 'automation';
  description: string;
  connected: boolean;
  enabled: boolean;
}

type GenericCard = { kind: 'generic' } & AppCardData;
export type AnyCard = GenericCard | PaymentCardData | WebhookCardData;

interface Props {
  card: AnyCard;
  onOpen: (card: AnyCard) => void;
  busy?: boolean;
}

function statusOf(card: AnyCard): { tone: 'live' | 'idle' | 'warn'; label: string } {
  if (card.enabled) return { tone: 'live', label: card.kind === 'webhook' ? 'On' : 'Connected' };
  if (card.connected) return { tone: 'warn', label: 'Saved, off' };
  return { tone: 'idle', label: 'Not connected' };
}

function footNote(card: AnyCard): string {
  if (card.kind === 'generic') {
    if (card.lastUsedAt) return `Last used ${relativeTime(card.lastUsedAt)}`;
    if (card.verifiedAt) return `Verified ${relativeTime(card.verifiedAt)}`;
  }
  if (card.enabled) return 'Active on this workspace';
  if (card.connected) return 'Credentials saved';
  return 'Not set up yet';
}

export function AppCard({ card, onOpen, busy = false }: Props) {
  const wordmark = isWordmark(card.id);
  const status = statusOf(card);

  return (
    <Card withBorder radius="md" padding="md" className={classes.card}>
      <div className={classes.cardTop}>
        <span className={classes.logo} data-wordmark={wordmark || undefined}>
          <AppLogo appId={card.id} height={wordmark ? 18 : 24} />
        </span>
        <StatusPill tone={status.tone} label={status.label} />
      </div>

      <div>
        <Text fw={650} size="md">
          {card.name}
        </Text>
        <Text size="sm" c="dimmed" mt={4} className={classes.desc}>
          {card.description}
        </Text>
      </div>

      <div className={classes.cardFoot}>
        <Text size="xs" c="dimmed" truncate>
          {footNote(card)}
        </Text>
        <Button
          size="xs"
          variant={card.connected ? 'default' : 'filled'}
          loading={busy}
          leftSection={card.connected ? <IconSettings size={14} /> : <IconPlugConnected size={14} />}
          onClick={() => onOpen(card)}
        >
          {card.kind === 'webhook'
            ? card.enabled
              ? 'Turn off'
              : 'Turn on'
            : card.connected
              ? 'Manage'
              : 'Connect'}
        </Button>
      </div>
    </Card>
  );
}

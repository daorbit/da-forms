import { Anchor, Button, Group, Text } from '@mantine/core';
import { IconCheck, IconPlayerPause, IconPlugConnected } from '@tabler/icons-react';
import { relativeTime } from '@/lib/relativeTime';
import classes from './apps.module.css';
import type { AppCard as AppCardData } from '@/types';
import { AppMark, APP_TINT } from './AppLogos';

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

const ACTION_HINT: Record<string, string> = {
  email: 'Connect it to send notification emails from your own domain.',
  payments: 'Connect your account to take payments on forms with a payment field.',
  automation: 'Turn it on, then set a URL from any form’s Webhook panel.',
};

/**
 * One integration, drawn like Quantalog's own connection cards: a tinted logo
 * tile, the name and what it does, then either a Connect button or — once it
 * works — a quiet line saying so, with Manage as a link.
 */
export function AppCard({ card, onOpen, busy = false }: Props) {
  const tint = APP_TINT[card.id] ?? 'var(--mantine-primary-color-filled)';
  const lastUsed = card.kind === 'generic' ? card.lastUsedAt : undefined;

  return (
    <div className={classes.card}>
      <span
        aria-hidden
        className={classes.mark}
        style={{ background: `color-mix(in srgb, ${tint} 16%, transparent)` }}
      >
        <AppMark appId={card.id} size={26} />
      </span>

      <Text fw={600} mt="md">
        {card.name}
      </Text>
      <Text size="sm" c="dimmed" mt={4} style={{ flex: 1 }}>
        {card.description}
      </Text>

      <div className={classes.action}>
        {card.enabled ? (
          <Group gap={8} wrap="nowrap">
            <IconCheck size={14} color="var(--mantine-color-teal-6)" style={{ flexShrink: 0 }} />
            <Text size="xs" c="dimmed" truncate>
              {card.kind === 'webhook' ? 'On for this workspace' : 'Connected'}
              {lastUsed ? ` · last used ${relativeTime(lastUsed)}` : ''}
            </Text>
            <Anchor
              component="button"
              type="button"
              size="xs"
              c="dimmed"
              underline="always"
              disabled={busy}
              onClick={() => onOpen(card)}
              style={{ flexShrink: 0 }}
            >
              {card.kind === 'webhook' ? 'Turn off' : 'Manage'}
            </Anchor>
          </Group>
        ) : card.connected ? (
          <Group gap={8} wrap="nowrap">
            <IconPlayerPause size={14} color="var(--mantine-color-yellow-6)" style={{ flexShrink: 0 }} />
            <Text size="xs" c="dimmed" truncate>
              Saved, but switched off
            </Text>
            <Anchor
              component="button"
              type="button"
              size="xs"
              underline="always"
              onClick={() => onOpen(card)}
              style={{ flexShrink: 0 }}
            >
              Turn on
            </Anchor>
          </Group>
        ) : (
          <>
            <Text size="xs" c="dimmed" mb={10}>
              {ACTION_HINT[card.category] ?? 'Connect it to use it from your forms.'}
            </Text>
            <Button
              size="sm"
              loading={busy}
              leftSection={<IconPlugConnected size={15} />}
              onClick={() => onOpen(card)}
            >
              {card.kind === 'webhook' ? 'Turn on webhooks' : `Connect ${card.name}`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

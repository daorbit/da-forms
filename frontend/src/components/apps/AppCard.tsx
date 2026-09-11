import { Card, Group, Text, Badge, Button, Stack, Box } from '@mantine/core';
import { IconPlugConnected } from '@tabler/icons-react';
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

type GenericCard = { kind: 'generic' } & AppCardData;
export type AnyCard = GenericCard | PaymentCardData;

interface Props {
  card: AnyCard;
  onOpen: (card: AnyCard) => void;
}

function StatusBadge({ connected, enabled }: { connected: boolean; enabled: boolean }) {
  if (enabled)
    return (
      <Badge color="teal" variant="light" radius="sm">
        Connected
      </Badge>
    );
  if (connected)
    return (
      <Badge color="gray" variant="light" radius="sm">
        Saved, off
      </Badge>
    );
  return (
    <Badge color="gray" variant="outline" radius="sm">
      Not connected
    </Badge>
  );
}

export function AppCard({ card, onOpen }: Props) {
  const wordmark = isWordmark(card.id);

  return (
    <Card withBorder radius="md" padding="lg">
      <Stack gap="sm" h="100%">
        <Group justify="space-between" wrap="nowrap" align="flex-start" gap="sm">
          <Group gap="sm" wrap="nowrap" align="center" style={{ minWidth: 0 }}>
            {wordmark ? (
              // A wordmark carries its own name — show it at a readable height,
              // no square tile to squash it into.
              <Box
                style={{
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  color: 'var(--mantine-color-text)',
                }}
              >
                <AppLogo appId={card.id} height={22} />
              </Box>
            ) : (
              <Box
                style={{
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--mantine-color-default-border)',
                  borderRadius: 'var(--mantine-radius-md)',
                  flexShrink: 0,
                }}
              >
                <AppLogo appId={card.id} height={24} />
              </Box>
            )}
            {/* The wordmark already says the name, so it is not repeated. */}
            {!wordmark && (
              <div style={{ minWidth: 0 }}>
                <Text fw={600} truncate>
                  {card.name}
                </Text>
                <Text size="xs" c="dimmed" tt="capitalize">
                  {card.category}
                </Text>
              </div>
            )}
          </Group>
          <StatusBadge connected={card.connected} enabled={card.enabled} />
        </Group>

        {wordmark && (
          <Text size="xs" c="dimmed" tt="capitalize" mt={-4}>
            {card.category}
          </Text>
        )}

        <Text size="sm" c="dimmed" style={{ flex: 1 }}>
          {card.description}
        </Text>

        <Button
          variant="default"
          fullWidth
          leftSection={<IconPlugConnected size={16} />}
          onClick={() => onOpen(card)}
        >
          {card.connected ? 'Manage' : 'Connect'}
        </Button>
      </Stack>
    </Card>
  );
}

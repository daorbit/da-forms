import { Anchor, Group, Text } from '@mantine/core';
import type { FormBranding } from '@/types';

/**
 * The caption under a public form and its thank-you screen.
 *
 * Renders nothing when the workspace's plan lets it opt out — the decision was
 * already made server-side, so this only has to honour it. Deliberately quiet:
 * it is a credit, not a promotion, and it sits under someone else's form.
 */
export function PoweredBy({ branding }: { branding?: FormBranding }) {
  if (!branding?.showPoweredBy) return null;

  return (
    <Group justify="center" mt="xl" mb="md">
      <Anchor
        href="https://quantalog.com"
        target="_blank"
        rel="noreferrer noopener"
        underline="never"
      >
        <Text size="xs" c="dimmed">
          {branding.poweredByLabel}
        </Text>
      </Anchor>
    </Group>
  );
}

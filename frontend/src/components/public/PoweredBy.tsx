import { Anchor, Group, Text } from '@mantine/core';
import type { FormBranding } from '@/types';

export function PoweredBy({ branding }: { branding?: FormBranding }) {
  if (!branding?.showPoweredBy) return null;

  return (
    <Group justify="center" mt="lg">
      <Anchor
        href="https://quantalog.com"
        target="_blank"
        rel="noreferrer noopener"
        underline="never"
      >
        <Text size="xs" c="dimmed" ta="center">
          {branding.poweredByLabel}
        </Text>
      </Anchor>
    </Group>
  );
}

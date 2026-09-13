import { Anchor, Group, Text } from '@mantine/core';
import type { FormBranding, FormTheme } from '@/types';

export function PoweredBy({
  branding,
  theme,
}: {
  branding?: FormBranding;
  theme?: FormTheme;
}) {
  if (!branding?.showPoweredBy) return null;

  const embedded = theme?.scope === 'card';

  return (
    <Group
      justify="center"
      mt={embedded ? 'lg' : 'xl'}
      mb={embedded ? 'lg' : 'md'}
      px="md"
    >
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

import type { ReactNode } from 'react';
import { Box, Group, Text, Title } from '@mantine/core';

/**
 * Quantalog's page header: a large title, one dimmed line under it, actions on
 * the right. Kept identical to the host app's `PageHeader` so a page opened
 * inside Quantalog reads as one of its own.
 */
export function PageHeader({
  title,
  description,
  actions,
  leading,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Sits left of the title — a back button on a detail page. */
  leading?: ReactNode;
}) {
  return (
    <Box mb="xl">
      <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
        <Group gap="sm" align="flex-start" wrap="nowrap" style={{ flex: '1 1 260px', minWidth: 0 }}>
          {leading}
          <div style={{ minWidth: 0, flex: 1 }}>
            <Title order={1} fz={24} lh={1.25} style={{ letterSpacing: '-0.02em' }}>
              {title}
            </Title>
            {description && (
              <Text c="dimmed" size="sm" mt={4}>
                {description}
              </Text>
            )}
          </div>
        </Group>
        {actions && (
          <Group gap="sm" wrap="wrap" justify="flex-end">
            {actions}
          </Group>
        )}
      </Group>
    </Box>
  );
}

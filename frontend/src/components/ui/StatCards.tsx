import type { ReactNode } from 'react';
import { Card, Group, SimpleGrid, Skeleton, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';

export interface StatItem {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  /** Opens more detail — the card becomes a button with a chevron. */
  onClick?: () => void;
}

/**
 * Quantalog's stat card: a light accent tile with the icon, the number large,
 * what it counts in a dimmed line beneath. Null items render skeletons.
 */
export function StatCards({ items, count = 4 }: { items: StatItem[] | null; count?: number }) {
  const cols = { base: 2, sm: Math.min(count, 3), md: count };
  if (!items) {
    return (
      <SimpleGrid cols={cols} spacing="md">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} withBorder radius="md" padding="md">
            <Group gap="sm" wrap="nowrap">
              <Skeleton height={38} width={38} radius="md" />
              <div style={{ flex: 1 }}>
                <Skeleton height={20} width={56} />
                <Skeleton height={10} width={90} mt={6} />
              </div>
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid cols={cols} spacing="md">
      {items.map((item) => {
        const card = (
          <Card withBorder radius="md" padding="md" h="100%">
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon variant="light" size={38} radius="md">
                {item.icon}
              </ThemeIcon>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Text fz={22} fw={700} lh={1.1} truncate style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {item.value}
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  {item.label}
                </Text>
              </div>
              {item.onClick && <IconChevronRight size={16} color="var(--mantine-color-dimmed)" />}
            </Group>
          </Card>
        );
        return item.onClick ? (
          <UnstyledButton key={item.label} onClick={item.onClick} style={{ display: 'block' }}>
            {card}
          </UnstyledButton>
        ) : (
          <div key={item.label}>{card}</div>
        );
      })}
    </SimpleGrid>
  );
}

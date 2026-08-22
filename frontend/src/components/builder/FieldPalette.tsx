import { useState } from 'react';
import { Stack, Text, UnstyledButton, SimpleGrid, TextInput, Box } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { fieldPalette } from '@/lib/fieldPalette';
import type { FieldType } from '@/types';
import classes from './FieldPalette.module.css';

interface Props {
  onAdd: (type: FieldType) => void;
}

export function FieldPalette({ onAdd }: Props) {
  const [query, setQuery] = useState('');

  const groups = fieldPalette
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.label.toLowerCase().includes(query.trim().toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Box>
      <Box p="md" className={classes.searchWrap}>
        <TextInput
          placeholder="Search"
          radius="md"
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Box>

      <Stack gap="lg" p="md" pt={0}>
        {groups.map((group) => (
          <div key={group.group}>
            <Text size="xs" fw={600} c="dimmed" mb="xs">
              {group.group}
            </Text>
            <SimpleGrid cols={3} spacing="xs">
              {group.items.map((item) => (
                <UnstyledButton
                  key={item.type}
                  className={classes.paletteItem}
                  onClick={() => onAdd(item.type)}
                >
                  <item.icon size={20} stroke={1.5} color={`var(--mantine-color-${item.color}-6)`} />
                  <Text size="xs" mt={6} c="dark.5">
                    {item.label}
                  </Text>
                </UnstyledButton>
              ))}
            </SimpleGrid>
          </div>
        ))}
      </Stack>
    </Box>
  );
}

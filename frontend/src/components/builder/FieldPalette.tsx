import { useState } from 'react';
import { TextInput, Text } from '@mantine/core';
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
    <div className={classes.wrapper}>
      <div className={classes.searchWrap}>
        <TextInput
          placeholder="Search"
          radius="md"
          leftSection={<IconSearch size={15} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className={classes.scroll}>
        {groups.map((group) => (
          <div key={group.group} className={classes.group}>
            <p className={classes.groupLabel}>{group.group}</p>
            <div className={classes.grid}>
              {group.items.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  className={classes.paletteItem}
                  onClick={() => onAdd(item.type)}
                >
                  <item.icon size={20} stroke={1.6} color={`var(--mantine-color-${item.color}-6)`} />
                  <span className={classes.itemLabel}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {groups.length === 0 && (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No fields match "{query}"
          </Text>
        )}
      </div>
    </div>
  );
}

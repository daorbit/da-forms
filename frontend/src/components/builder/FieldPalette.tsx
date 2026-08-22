import { useState } from 'react';
import { TextInput, Text } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { fieldPalette, paletteKey } from '@/lib/fieldPalette';
import { PaletteTile } from './PaletteTile';
import type { FieldType } from '@/types';
import classes from './FieldPalette.module.css';

interface Props {
  onAdd: (type: FieldType, columns?: number) => void;
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
          <section key={group.group} className={classes.group}>
            <p className={classes.groupLabel}>{group.group}</p>
            <div className={classes.grid}>
              {group.items.map((item) => (
                <PaletteTile
                  key={paletteKey(item)}
                  item={item}
                  onAdd={() => onAdd(item.type, item.columns)}
                />
              ))}
            </div>
          </section>
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

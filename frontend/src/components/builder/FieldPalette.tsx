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

/**
 * One accent per group, worn only by the group's heading dot. Tinting every
 * icon meant ten hues competing across the grid; a single dot per section can
 * carry full saturation and still reads as a label rather than as noise.
 *
 * Bare `r, g, b` so the stylesheet can vary alpha.
 */
const groupAccent: Record<string, string> = {
  Grid: '148, 163, 184',
  'Basic Info': '96, 165, 250',
  Textbox: '167, 139, 250',
  Number: '45, 212, 191',
  Choices: '251, 146, 60',
  'Date & Time': '244, 114, 182',
  Uploads: '56, 189, 248',
  'Rating Scales': '250, 204, 21',
  'Legal & Consent': '52, 211, 153',
  Identifier: '129, 140, 248',
  'Page Elements': '148, 163, 184',
};

const fallbackAccent = '148, 163, 184';

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
            <p className={classes.groupLabel}>
              <span
                className={classes.groupDot}
                style={{
                  ['--tile-accent' as string]: groupAccent[group.group] ?? fallbackAccent,
                }}
              />
              {group.group}
            </p>
            <div className={classes.grid}>
              {group.items.map((item, index) => (
                <PaletteTile
                  key={paletteKey(item)}
                  item={item}
                  index={index}
                  accent={groupAccent[group.group] ?? fallbackAccent}
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

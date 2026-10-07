import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollArea, Text } from '@mantine/core';
import { SearchIcon } from 'lucide-react';
import type { PaletteItem } from '@/lib/fieldPalette';
import { POPULAR_KEYS, searchFields } from '@/lib/fieldSearch';
import classes from './Canvas.module.css';

interface Props {
  onPick: (item: PaletteItem) => void;
  onClose: () => void;
}

export function QuickInsertMenu({ onPick, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => searchFields(query), [query]);
  const showPopularLabel = !query.trim();

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = results[active];
      if (hit) onPick(hit.item);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }

  return (
    <div className={classes.quick} onKeyDown={onKeyDown}>
      <div className={classes.quickSearch}>
        <SearchIcon size={15} />
        <input
          autoFocus
          className={classes.quickInput}
          placeholder="Search fields…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          aria-label="Search fields"
        />
        <kbd className={classes.kbd}>Esc</kbd>
      </div>
      <ScrollArea.Autosize mah={320} type="hover" scrollbarSize={6}>
        <div ref={listRef} className={classes.quickList} role="listbox">
          {results.length === 0 && (
            <Text size="xs" c="dimmed" ta="center" py="lg">
              No field matches “{query}”
            </Text>
          )}
          {results.map((r, index) => {
            const Icon = r.item.icon;
            const firstOther = showPopularLabel && index === POPULAR_KEYS.length;
            return (
              <div key={r.key}>
                {showPopularLabel && index === 0 && <div className={classes.quickGroup}>Popular</div>}
                {firstOther && <div className={classes.quickGroup}>All fields</div>}
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  data-index={index}
                  data-active={index === active || undefined}
                  className={classes.quickItem}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => onPick(r.item)}
                >
                  <span className={classes.quickIcon}>
                    <Icon size={15} strokeWidth={1.8} />
                  </span>
                  <span className={classes.quickLabel}>{r.item.label}</span>
                  <span className={classes.quickMeta}>{r.group}</span>
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea.Autosize>
    </div>
  );
}

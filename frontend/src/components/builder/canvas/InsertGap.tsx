import { useState } from 'react';
import { Popover } from '@mantine/core';
import { PlusIcon } from 'lucide-react';
import type { PaletteItem } from '@/lib/fieldPalette';
import { QuickInsertMenu } from './QuickInsertMenu';
import classes from './Canvas.module.css';

interface Props {
  onPick: (item: PaletteItem) => void;
}

export function InsertGap({ onPick }: Props) {
  const [opened, setOpened] = useState(false);

  return (
    <div className={classes.gap} data-open={opened || undefined}>
      <span className={classes.gapLine} aria-hidden />
      <Popover
        opened={opened}
        onChange={setOpened}
        position="bottom"
        width={300}
        shadow="lg"
        radius={14}
        offset={6}
        trapFocus
        returnFocus
      >
        <Popover.Target>
          <button
            type="button"
            className={classes.gapButton}
            aria-label="Insert a field here"
            onClick={(e) => {
              e.stopPropagation();
              setOpened((o) => !o);
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <PlusIcon size={14} strokeWidth={2.4} />
          </button>
        </Popover.Target>
        <Popover.Dropdown p={0} onClick={(e) => e.stopPropagation()}>
          <QuickInsertMenu
            onClose={() => setOpened(false)}
            onPick={(item) => {
              setOpened(false);
              onPick(item);
            }}
          />
        </Popover.Dropdown>
      </Popover>
      <span className={classes.gapLine} aria-hidden />
    </div>
  );
}

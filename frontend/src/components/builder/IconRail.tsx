import { Tooltip } from '@mantine/core';
import { IconCircleCheck, IconCode } from '@tabler/icons-react';
import classes from './IconRail.module.css';

export type RailPanel = 'thankYou' | 'embed';

interface Props {
  active: RailPanel | null;
  onSelect: (panel: RailPanel) => void;
}

const items: { id: RailPanel; label: string; icon: typeof IconCode }[] = [
  { id: 'thankYou', label: 'Thank You Page & Redirection', icon: IconCircleCheck },
  { id: 'embed', label: 'Share & Embed', icon: IconCode },
];

export function IconRail({ active, onSelect }: Props) {
  return (
    <div className={classes.rail}>
      {items.map((item) => (
        <Tooltip key={item.id} label={item.label} position="left" withArrow color="dark" offset={10}>
          <button
            type="button"
            className={`${classes.railButton} ${active === item.id ? classes.railButtonActive : ''}`}
            onClick={() => onSelect(item.id)}
            aria-label={item.label}
          >
            <item.icon size={19} stroke={1.6} />
          </button>
        </Tooltip>
      ))}
    </div>
  );
}

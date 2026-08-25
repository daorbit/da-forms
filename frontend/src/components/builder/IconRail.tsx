import { Tooltip } from '@mantine/core';
import { IconCircleCheck, IconCode, IconAdjustmentsHorizontal, IconPalette, IconListNumbers } from '@tabler/icons-react';
import classes from './IconRail.module.css';

export type RailPanel = 'quickSettings' | 'thankYou' | 'embed' | 'theme' | 'steps';

interface Props {
  active: RailPanel | null;
  onSelect: (panel: RailPanel) => void;
}

const items: { id: RailPanel; label: string; icon: typeof IconCode; color: string }[] = [
  { id: 'quickSettings', label: 'Quick Settings', icon: IconAdjustmentsHorizontal, color: 'blue' },
  { id: 'theme', label: 'Theme', icon: IconPalette, color: 'pink' },
  { id: 'steps', label: 'Steps & Progress', icon: IconListNumbers, color: 'orange' },
  { id: 'thankYou', label: 'Thank You Page & Redirection', icon: IconCircleCheck, color: 'emerald' },
  { id: 'embed', label: 'Share & Embed', icon: IconCode, color: 'grape' },
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
            <item.icon size={20} stroke={1.6} color={`var(--mantine-color-${item.color}-6)`} />
          </button>
        </Tooltip>
      ))}
    </div>
  );
}

import type { ReactNode } from 'react';
import { Tooltip } from '@mantine/core';
import { IconCircleCheck, IconCode, IconAdjustmentsHorizontal, IconPalette, IconListNumbers, IconMail, IconCreditCard } from '@tabler/icons-react';
import { OrbitMark } from '@/components/OrbitMark';
import classes from './IconRail.module.css';

export type RailPanel = 'ai' | 'quickSettings' | 'thankYou' | 'embed' | 'theme' | 'steps' | 'notifications' | 'payments';

interface Props {
  active: RailPanel | null;
  onSelect: (panel: RailPanel) => void;
}

 
const items: { id: RailPanel; label: string; icon: () => ReactNode }[] = [
  { id: 'ai', label: 'Edit with AI', icon: () => <OrbitMark size={19} /> },
  { id: 'quickSettings', label: 'Quick Settings', icon: () => <IconAdjustmentsHorizontal size={19} stroke={1.6} /> },
  { id: 'theme', label: 'Theme', icon: () => <IconPalette size={19} stroke={1.6} /> },
  { id: 'steps', label: 'Steps & Progress', icon: () => <IconListNumbers size={19} stroke={1.6} /> },
  { id: 'thankYou', label: 'Thank You Page & Redirection', icon: () => <IconCircleCheck size={19} stroke={1.6} /> },
  { id: 'notifications', label: 'Email Notifications', icon: () => <IconMail size={19} stroke={1.6} /> },
  { id: 'payments', label: 'Payments', icon: () => <IconCreditCard size={19} stroke={1.6} /> },
  { id: 'embed', label: 'Share & Embed', icon: () => <IconCode size={19} stroke={1.6} /> },
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
            <item.icon />
          </button>
        </Tooltip>
      ))}
    </div>
  );
}

import type { ReactNode } from 'react';
import { Tooltip } from '@mantine/core';
import {
  BellRingIcon,
  CircleCheckIcon,
  ListOrderedIcon,
  MailIcon,
  PaletteIcon,
  PlugIcon,
  Share2Icon,
  SlidersHorizontalIcon,
  WebhookIcon,
} from 'lucide-react';
import { OrbitMark } from '@/components/OrbitMark';
import classes from './IconRail.module.css';

export type RailPanel = 'ai' | 'quickSettings' | 'thankYou' | 'embed' | 'theme' | 'steps' | 'notifications' | 'drawerNotify' | 'webhook' | 'payments' | 'integrations';

interface Props {
  active: RailPanel | null;
  onSelect: (panel: RailPanel) => void;
}

interface RailItem {
  id: RailPanel;
  label: string;
  icon: ReactNode;
}

const ICON = { size: 18, strokeWidth: 1.7 };

const GROUPS: RailItem[][] = [
  [
    { id: 'quickSettings', label: 'Quick settings', icon: <SlidersHorizontalIcon {...ICON} /> },
    { id: 'theme', label: 'Theme', icon: <PaletteIcon {...ICON} /> },
    { id: 'steps', label: 'Steps & progress', icon: <ListOrderedIcon {...ICON} /> },
  ],
  [
    { id: 'thankYou', label: 'After submission', icon: <CircleCheckIcon {...ICON} /> },
    { id: 'notifications', label: 'Email notifications', icon: <MailIcon {...ICON} /> },
    { id: 'drawerNotify', label: 'Notification drawer', icon: <BellRingIcon {...ICON} /> },
  ],
  [
    { id: 'webhook', label: 'Webhook', icon: <WebhookIcon {...ICON} /> },
    { id: 'integrations', label: 'Integrations', icon: <PlugIcon {...ICON} /> },
  ],
];

function RailButton({
  item,
  active,
  onSelect,
  className,
}: {
  item: RailItem;
  active: boolean;
  onSelect: (panel: RailPanel) => void;
  className?: string;
}) {
  return (
    <Tooltip label={item.label} position="left" withArrow offset={12} openDelay={150}>
      <button
        type="button"
        className={`${classes.button} ${className ?? ''}`}
        data-active={active || undefined}
        aria-pressed={active}
        aria-label={item.label}
        onClick={() => onSelect(item.id)}
      >
        {item.icon}
      </button>
    </Tooltip>
  );
}

export function IconRail({ active, onSelect }: Props) {
  return (
    <nav className={classes.rail} aria-label="Form tools">
      <RailButton
        item={{ id: 'ai', label: 'Edit with Orbit AI', icon: <OrbitMark size={22} /> }}
        active={active === 'ai'}
        onSelect={onSelect}
        className={classes.orbit}
      />

      {GROUPS.map((group, index) => (
        <div key={index} className={classes.group}>
          {group.map((item) => (
            <RailButton key={item.id} item={item} active={active === item.id} onSelect={onSelect} />
          ))}
        </div>
      ))}

      <div className={classes.footer}>
        <RailButton
          item={{ id: 'embed', label: 'Share & embed', icon: <Share2Icon {...ICON} /> }}
          active={active === 'embed'}
          onSelect={onSelect}
          className={classes.share}
        />
      </div>
    </nav>
  );
}

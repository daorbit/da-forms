import type { ReactNode } from 'react';
import { Tooltip } from '@mantine/core';
import {
  BellRingIcon,
  CircleCheckIcon,
  CodeIcon,
  ListOrderedIcon,
  MailIcon,
  PaletteIcon,
  PlugIcon,
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

 
const items: { id: RailPanel; label: string; icon: () => ReactNode }[] = [
  { id: 'ai', label: 'Edit with AI', icon: () => <OrbitMark size={19} /> },
  { id: 'quickSettings', label: 'Quick settings', icon: () => <SlidersHorizontalIcon size={19} strokeWidth={1.6} /> },
  { id: 'theme', label: 'Theme', icon: () => <PaletteIcon size={19} strokeWidth={1.6} /> },
  { id: 'steps', label: 'Steps & Progress', icon: () => <ListOrderedIcon size={19} strokeWidth={1.6} /> },
  { id: 'thankYou', label: 'After submission', icon: () => <CircleCheckIcon size={19} strokeWidth={1.6} /> },
  { id: 'notifications', label: 'Email Notifications', icon: () => <MailIcon size={19} strokeWidth={1.6} /> },
  { id: 'drawerNotify', label: 'Notification Drawer', icon: () => <BellRingIcon size={19} strokeWidth={1.6} /> },
  { id: 'webhook', label: 'Webhook', icon: () => <WebhookIcon size={19} strokeWidth={1.6} /> },
  // 'integrations' covers payment gateways too — there is no separate Payments
  // rail entry; a payment field's own settings link here as well.
  { id: 'integrations', label: 'Integrations', icon: () => <PlugIcon size={19} strokeWidth={1.6} /> },
  { id: 'embed', label: 'Share & Embed', icon: () => <CodeIcon size={19} strokeWidth={1.6} /> },
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

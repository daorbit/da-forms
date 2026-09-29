import type { ReactNode } from 'react';
import { PanelDrawer } from '@/components/ui/PanelDrawer';

interface Props {
  opened: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  children: ReactNode;
}

export function SettingsDrawer({ opened, onClose, title, subtitle, icon, children }: Props) {
  return (
    <PanelDrawer opened={opened} onClose={onClose} title={title} subtitle={subtitle} icon={icon} size={460}>
      {children}
    </PanelDrawer>
  );
}

import { ActionIcon, Tooltip } from '@mantine/core';
import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

export function HeaderIconButton({ label, icon: Icon, onClick }: Props) {
  return (
    <Tooltip label={label} withArrow>
      <ActionIcon variant="default" size="lg" radius="md" aria-label={label} onClick={onClick}>
        <Icon size={17} />
      </ActionIcon>
    </Tooltip>
  );
}

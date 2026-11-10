import { ActionIcon, Tooltip } from '@mantine/core';
import type { LucideIcon } from 'lucide-react';
import classes from './HeaderIconButton.module.css';

export type HeaderIconTone = 'blue' | 'teal' | 'violet' | 'orange' | 'pink';

interface Props {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  tone?: HeaderIconTone;
}

export function HeaderIconButton({ label, icon: Icon, onClick, tone }: Props) {
  return (
    <Tooltip label={label} withArrow>
      <ActionIcon
        variant="default"
        size="lg"
        radius="md"
        aria-label={label}
        onClick={onClick}
        className={classes.button}
        data-tone={tone}
      >
        <Icon size={17} />
      </ActionIcon>
    </Tooltip>
  );
}

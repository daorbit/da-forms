import type { ReactNode } from 'react';
import { UnstyledButton } from '@mantine/core';
import { CheckIcon } from 'lucide-react';
import classes from './templateSwitch.module.css';

interface Props {
  icon: ReactNode;
  title: string;
  body: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export function ModeOption({ icon, title, body, selected, disabled, onSelect }: Props) {
  return (
    <UnstyledButton
      className={classes.mode}
      role="radio"
      aria-checked={selected}
      data-selected={selected || undefined}
      disabled={disabled}
      onClick={onSelect}
    >
      <span className={classes.modeIcon}>{icon}</span>
      <span className={classes.modeText}>
        <span className={classes.modeTitle}>{title}</span>
        <span className={classes.modeBody}>{body}</span>
      </span>
      <span className={classes.modeCheck} aria-hidden>
        {selected && <CheckIcon size={12} strokeWidth={3} />}
      </span>
    </UnstyledButton>
  );
}

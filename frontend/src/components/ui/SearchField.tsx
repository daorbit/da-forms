import { ActionIcon, TextInput } from '@mantine/core';
import { SearchIcon, XIcon } from 'lucide-react';
import classes from './SearchField.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  className?: string;
}

export function SearchField({ value, onChange, placeholder = 'Search', ariaLabel, className }: Props) {
  return (
    <TextInput
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      leftSection={<SearchIcon size={15} />}
      rightSection={
        value ? (
          <ActionIcon variant="transparent" className={classes.clear} onClick={() => onChange('')} aria-label="Clear search">
            <XIcon size={13} />
          </ActionIcon>
        ) : undefined
      }
      aria-label={ariaLabel}
      classNames={{
        root: `${classes.root} ${className ?? ''}`,
        input: classes.input,
        section: classes.section,
      }}
    />
  );
}

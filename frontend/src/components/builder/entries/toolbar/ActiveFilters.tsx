import { UnstyledButton } from '@mantine/core';
import { XIcon } from 'lucide-react';
import classes from './EntriesToolbar.module.css';

export interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

interface Props {
  filters: ActiveFilter[];
  onClear: () => void;
}

export function ActiveFilters({ filters, onClear }: Props) {
  if (!filters.length) return null;

  return (
    <div className={classes.active}>
      {filters.map((filter) => (
        <span key={filter.key} className={classes.chip}>
          {filter.label}
          <UnstyledButton className={classes.chipRemove} onClick={filter.onRemove} aria-label={`Remove ${filter.label}`}>
            <XIcon size={12} />
          </UnstyledButton>
        </span>
      ))}
      <UnstyledButton className={classes.clearAll} onClick={onClear}>
        Clear all
      </UnstyledButton>
    </div>
  );
}

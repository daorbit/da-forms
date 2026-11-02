import { ActionIcon, Tooltip } from '@mantine/core';
import { RotateCw } from 'lucide-react';
import toolbar from './toolbar.module.css';

interface Props {
  onRefresh: () => void;
  refreshing: boolean;
  hint?: string;
  label?: string;
}

export function RefreshButton({ onRefresh, refreshing, hint = 'Refresh', label = 'Refresh' }: Props) {
  return (
    <Tooltip label={hint} withArrow>
      <ActionIcon variant="default" size={36} radius="md" onClick={onRefresh} aria-label={label}>
        <RotateCw size={16} className={refreshing ? toolbar.spinning : undefined} />
      </ActionIcon>
    </Tooltip>
  );
}

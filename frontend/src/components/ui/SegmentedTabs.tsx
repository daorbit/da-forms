import type { ReactNode } from 'react';
import { Tooltip, UnstyledButton } from '@mantine/core';
import classes from './SegmentedTabs.module.css';

export interface SegmentedTabItem<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
}

interface Props<T extends string> {
  value: T;
  onChange: (value: T) => void;
  data: SegmentedTabItem<T>[];
  fullWidth?: boolean;
  size?: 'sm' | 'md';
  ariaLabel: string;
}

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  data,
  fullWidth,
  size = 'md',
  ariaLabel,
}: Props<T>) {
  return (
    <div
      className={classes.root}
      role="tablist"
      aria-label={ariaLabel}
      data-full-width={fullWidth || undefined}
      data-size={size}
    >
      {data.map((item) => {
        const tab = (
          <UnstyledButton
            key={item.value}
            role="tab"
            aria-selected={item.value === value}
            aria-label={item.title}
            data-active={item.value === value || undefined}
            className={classes.tab}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </UnstyledButton>
        );
        return item.title ? (
          <Tooltip key={item.value} label={item.title} withArrow position="bottom" openDelay={250}>
            {tab}
          </Tooltip>
        ) : (
          tab
        );
      })}
    </div>
  );
}

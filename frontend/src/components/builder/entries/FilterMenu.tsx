import type { ReactNode } from 'react';
import { Button, Menu } from '@mantine/core';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import toolbar from '@/components/ui/toolbar.module.css';

export interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  icon: ReactNode;
  allLabel: string;
  value: string | undefined;
  options: FilterOption[];
  onSelect: (value: string | undefined) => void;
  clearable?: boolean;
}

export function FilterMenu({ icon, allLabel, value, options, onSelect, clearable = true }: Props) {
  const current = options.find((option) => option.value === value);

  return (
    <Menu width={200} position="bottom-start">
      <Menu.Target>
        <Button
          variant="subtle"
          className={toolbar.pillButton}
          data-active={(clearable && current) || undefined}
          leftSection={icon}
          rightSection={<ChevronDownIcon size={14} />}
        >
          {current?.label ?? allLabel}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {clearable && (
          <Menu.Item
            onClick={() => onSelect(undefined)}
            rightSection={!current ? <CheckIcon size={14} /> : undefined}
          >
            {allLabel}
          </Menu.Item>
        )}
        {options.map((option) => (
          <Menu.Item
            key={option.value}
            onClick={() => onSelect(option.value)}
            rightSection={current?.value === option.value ? <CheckIcon size={14} /> : undefined}
          >
            {option.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

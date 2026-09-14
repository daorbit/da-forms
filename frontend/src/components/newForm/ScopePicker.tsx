import { Group, Text, UnstyledButton } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import type { FormTheme } from '@/types';
import classes from './ScopePicker.module.css';

const CHOICES: {
  value: NonNullable<FormTheme['scope']>;
  label: string;
  body: string;
  art: string;
}[] = [
  {
    value: 'page',
    label: 'Standalone link',
    body: 'A hosted page of its own, with its own background and layout.',
    art: '/standalone.png',
  },
  {
    value: 'card',
    label: 'Embedded on a site',
    body: 'Just the form card, dropped into a page you already have.',
    art: '/embed-in-website.png',
  },
];

interface Props {
  value: NonNullable<FormTheme['scope']>;
  onChange: (scope: NonNullable<FormTheme['scope']>) => void;
}

export function ScopePicker({ value, onChange }: Props) {
  return (
    <Group grow align="stretch" gap="sm" wrap="nowrap">
      {CHOICES.map((choice) => (
        <UnstyledButton
          key={choice.value}
          onClick={() => onChange(choice.value)}
          className={`${classes.card} ${value === choice.value ? classes.cardActive : ''}`}
          aria-pressed={value === choice.value}
        >
          <span className={classes.stage}>
            <img src={choice.art} alt="" className={classes.stageArt} aria-hidden />
            {value === choice.value && (
              <span className={classes.checkBadge} aria-hidden>
                <IconCheck size={14} stroke={3} />
              </span>
            )}
          </span>
          <span className={classes.cardBody}>
            <Text fw={600} size="sm">
              {choice.label}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              {choice.body}
            </Text>
          </span>
        </UnstyledButton>
      ))}
    </Group>
  );
}

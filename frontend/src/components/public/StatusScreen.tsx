import type { ReactNode } from 'react';
import { Center, Container, Text, ThemeIcon } from '@mantine/core';
import classes from './StatusScreen.module.css';

interface Props {
  icon?: ReactNode;
  iconColor?: string;
  iconVariant?: 'light' | 'filled';
  title?: ReactNode;
  large?: boolean;
  children?: ReactNode;
  compact?: boolean;
}

export function StatusScreen({
  icon,
  iconColor = 'gray',
  iconVariant = 'light',
  title,
  large = false,
  children,
  compact = false,
}: Props) {
  return (
    <Center
      mih="100dvh"
      py={compact ? 0 : 64}
      className={`da-forms-light-surface ${classes.screen}`}
      data-mantine-color-scheme="light"
    >
      <Container size="xs" px="md" className={classes.body}>
        {icon && (
          <Center>
            <ThemeIcon size={64} radius="xl" color={iconColor} variant={iconVariant} autoContrast>
              {icon}
            </ThemeIcon>
          </Center>
        )}
        {title && (
          <Text ta="center" fw={800} mt="xl" className={classes.title} data-large={large || undefined}>
            {title}
          </Text>
        )}
        {children}
      </Container>
    </Center>
  );
}

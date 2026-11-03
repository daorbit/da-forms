import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { useHostTheme } from '@/hooks/useHostTheme';
import { themeFromHost, type HostTheme } from './themeParams';

interface HostThemeProviderProps {
  initial: HostTheme;
  children: ReactNode;
}

export function HostThemeProvider({ initial, children }: HostThemeProviderProps) {
  const { colorScheme } = useHostTheme(initial);
  return (
    <MantineProvider
      theme={themeFromHost(initial)}
      defaultColorScheme={initial.colorScheme}
      forceColorScheme={colorScheme === 'auto' ? undefined : colorScheme}
    >
      {children}
    </MantineProvider>
  );
}

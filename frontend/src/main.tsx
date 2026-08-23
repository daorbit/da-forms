import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { App } from '@/app/App';
import { themeFromParams } from '@/app/themeParams';
import { BOOT_SEARCH } from '@/lib/bootParams';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@/styles/global.css';

// Read once at boot: a host app sets the theme when it opens the iframe, and
// changing it means loading a new URL anyway.
const { theme, colorScheme } = themeFromParams(BOOT_SEARCH);

const dark = colorScheme === 'dark' ||
  (colorScheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
const managementTokens = dark
  ? {
      '--mantine-color-body': '#0b0c0e',
      '--mantine-color-text': '#f2f4f6',
      '--mantine-color-default': '#16181b',
      '--mantine-color-default-hover': '#1c1f23',
      '--mantine-color-default-color': '#f2f4f6',
      '--mantine-color-default-border': '#26292e',
      '--mantine-color-dimmed': '#a9afba',
      '--mantine-color-placeholder': '#6d737e',
    }
  : {
      '--mantine-color-body': '#f4f5f7',
      '--mantine-color-text': '#111418',
      '--mantine-color-default': '#ffffff',
      '--mantine-color-default-hover': '#f1f3f5',
      '--mantine-color-default-color': '#111418',
      '--mantine-color-default-border': '#e5e7eb',
      '--mantine-color-dimmed': '#4b5563',
      '--mantine-color-placeholder': '#9ca3af',
    };
Object.entries(managementTokens).forEach(([name, value]) => {
  document.documentElement.style.setProperty(name, value, 'important');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme={colorScheme} forceColorScheme={colorScheme === 'auto' ? undefined : colorScheme}>
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </React.StrictMode>,
);

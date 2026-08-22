import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { App } from '@/app/App';
import { themeFromParams } from '@/app/themeParams';
import { BOOT_SEARCH } from '@/lib/bootParams';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@/styles/global.css';

// Read once at boot: a host app sets the theme when it opens the iframe, and
// changing it means loading a new URL anyway.
const { theme, colorScheme } = themeFromParams(BOOT_SEARCH);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme={colorScheme} forceColorScheme={colorScheme === 'auto' ? undefined : colorScheme}>
      <Notifications />
      <App />
    </MantineProvider>
  </React.StrictMode>,
);

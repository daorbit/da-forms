import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import 'da-frame-set/styles.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@/styles/tokens.css';
import '@/styles/mantine-overrides.css';
import '@/styles/surfaces.css';
import '@/styles/global.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { PlanLimitDialog } from './components/PlanLimitDialog';
import { App } from '@/app/App';
import { readHostTheme, themeFromHost } from '@/app/themeParams';
import { applyHostTokens } from '@/app/hostTokens';
import { BOOT_SEARCH } from '@/lib/bootParams';

const host = readHostTheme(BOOT_SEARCH);
applyHostTokens(host);
const theme = themeFromHost(host);
const { colorScheme } = host;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme={colorScheme} forceColorScheme={colorScheme === 'auto' ? undefined : colorScheme}>
      <Notifications position="top-center" limit={3} />
      <PlanLimitDialog />
      <App />
    </MantineProvider>
  </React.StrictMode>,
);

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import 'da-frame-set/styles.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@/styles/fonts.css';
import '@/styles/tokens.css';
import '@/styles/mantine-overrides.css';
import '@/styles/dropdown.css';
import '@/styles/surfaces.css';
import '@/styles/global.css';
import '@/styles/mobile.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Notifications } from '@mantine/notifications';
import { PlanLimitDialog } from './components/PlanLimitDialog';
import { App } from '@/app/App';
import { HostThemeProvider } from '@/app/HostThemeProvider';
import { readHostTheme } from '@/app/themeParams';
import { applyHostTokens } from '@/app/hostTokens';
import { BOOT_SEARCH } from '@/lib/bootParams';
import { installStaleChunkReload } from '@/lib/staleChunkReload';

installStaleChunkReload();

const host = readHostTheme(BOOT_SEARCH);
applyHostTokens(host);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HostThemeProvider initial={host}>
      <Notifications position="top-center" limit={3} />
      <PlanLimitDialog />
      <App />
    </HostThemeProvider>
  </React.StrictMode>,
);

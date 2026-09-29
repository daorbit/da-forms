import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { PlanLimitDialog } from './components/PlanLimitDialog';
import { App } from '@/app/App';
import { themeFromParams } from '@/app/themeParams';
import { BOOT_SEARCH, HOST_BG_WASH, HOST_TEXTURED_BG } from '@/lib/bootParams';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import 'da-frame-set/styles.css';
import '@/styles/global.css';

// Read once at boot: a host app sets the theme when it opens the iframe, and
// changing it means loading a new URL anyway.
const { theme, colorScheme, accentContrast } = themeFromParams(BOOT_SEARCH);

const dark = colorScheme === 'dark' ||
  (colorScheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
const managementTokens = dark
  ? {
      '--mantine-color-body': '#000000',
      '--mantine-color-text': '#f5f5f5',
      '--mantine-color-default': '#161616',
      '--mantine-color-default-hover': '#1c1c1c',
      '--mantine-color-default-color': '#f5f5f5',
      '--mantine-color-default-border': '#292929',
      '--mantine-color-dimmed': '#a3a3a3',
      '--mantine-color-placeholder': '#8f8f8f',
      '--cta': '#fafafa',
      '--cta-hover': '#e5e5e5',
      '--cta-fg': '#0a0a0a',
    }
  : {
      '--mantine-color-body': '#f5f5f5',
      '--mantine-color-text': '#171717',
      '--mantine-color-default': '#ffffff',
      '--mantine-color-default-hover': '#f5f5f5',
      '--mantine-color-default-color': '#171717',
      '--mantine-color-default-border': '#e5e5e5',
      '--mantine-color-dimmed': '#525252',
      '--mantine-color-placeholder': '#737373',
      '--cta': '#171717',
      '--cta-hover': '#333333',
      '--cta-fg': '#ffffff',
    };
Object.entries(managementTokens).forEach(([name, value]) => {
  document.documentElement.style.setProperty(name, value, 'important');
});

 
document.documentElement.style.setProperty('--mantine-color-black', '#0a0b0d', 'important');

// The host's background shows through the page ground — see global.css.
if (HOST_TEXTURED_BG) document.documentElement.setAttribute('data-host-bg', 'textured');
if (HOST_BG_WASH) document.documentElement.style.setProperty('--host-bg-wash', HOST_BG_WASH);

 
if (accentContrast) {
  const style = document.createElement('style');
  style.textContent = [
    // Switch thumb: checked only. An unchecked thumb sits on a dark track and
    // must stay white, so this cannot be a blanket `--switch-thumb-bg`.
    `.mantine-Switch-input:checked + * > .mantine-Switch-thumb{background-color:${accentContrast};}`,
 
    `.mantine-Checkbox-input:checked{--checkbox-icon-color:${accentContrast};}`,
    `.mantine-Radio-radio:checked{--radio-icon-color:${accentContrast};}`,
  ].join('');
  document.head.appendChild(style);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme={colorScheme} forceColorScheme={colorScheme === 'auto' ? undefined : colorScheme}>
      <Notifications position="top-right" />
      <PlanLimitDialog />
      <App />
    </MantineProvider>
  </React.StrictMode>,
);

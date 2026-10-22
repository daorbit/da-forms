import { HOST_BG_WASH, HOST_TEXTURED_BG, IS_EMBEDDED } from '@/lib/bootParams';
import { buildScale } from '@/lib/color';
import { FONT_SIZE_PX, type HostTheme } from './themeParams';

const FONT_BASE_PX: Record<string, number> = { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 };

const BRAND_ACCENT = '#2f6bff';

const NEUTRAL_SOFT = {
  light: 'color-mix(in srgb, var(--text) 6%, transparent)',
  dark: 'color-mix(in srgb, var(--text) 9%, transparent)',
};

const NEUTRAL_SOFT_HOVER = {
  light: 'color-mix(in srgb, var(--text) 10%, transparent)',
  dark: 'color-mix(in srgb, var(--text) 14%, transparent)',
};

function applyAccent(root: HTMLElement, host: HostTheme) {
  if (host.accent) root.style.setProperty('--accent', host.accent);
  const scale = buildScale(BRAND_ACCENT, 6);
  const soft = host.dark ? NEUTRAL_SOFT.dark : NEUTRAL_SOFT.light;
  const softHover = host.dark ? NEUTRAL_SOFT_HOVER.dark : NEUTRAL_SOFT_HOVER.light;

  scale.forEach((color, i) => {
    root.style.setProperty(`--mantine-color-emerald-${i}`, color);
    root.style.setProperty(`--mantine-primary-color-${i}`, color);
  });

  for (const name of ['emerald', 'primary']) {
    root.style.setProperty(`--mantine-color-${name}-filled`, 'var(--accent)');
    root.style.setProperty(`--mantine-color-${name}-filled-hover`, 'var(--blue-10)');
    root.style.setProperty(`--mantine-color-${name}-light`, soft);
    root.style.setProperty(`--mantine-color-${name}-light-hover`, softHover);
    root.style.setProperty(`--mantine-color-${name}-light-color`, 'var(--text)');
    root.style.setProperty(`--mantine-color-${name}-text`, 'var(--accent-text)');
    root.style.setProperty(`--mantine-color-${name}-outline`, 'var(--accent)');
    root.style.setProperty(`--mantine-color-${name}-outline-hover`, soft);
  }
}

function applyFontSize(root: HTMLElement, px: number) {
  const scale = px / FONT_SIZE_PX.default;
  if (scale === 1) return;
  for (const [step, base] of Object.entries(FONT_BASE_PX)) {
    root.style.setProperty(`--mantine-font-size-${step}`, `${Math.round(base * scale * 10) / 10}px`);
  }
}

export function applyHostTokens(host: HostTheme) {
  const root = document.documentElement;

  applyAccent(root, host);
  applyFontSize(root, FONT_SIZE_PX[host.fontSize]);

  root.setAttribute('data-density', host.density);
  root.setAttribute('data-table-style', host.table);
  root.setAttribute('data-motion', host.motion ? 'on' : 'off');

  if (IS_EMBEDDED) root.setAttribute('data-embedded', '');
  if (HOST_TEXTURED_BG) root.setAttribute('data-host-bg', 'textured');
  if (HOST_BG_WASH) root.style.setProperty('--host-bg-wash', HOST_BG_WASH);
}

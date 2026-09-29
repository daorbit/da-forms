import { HOST_BG_WASH, HOST_TEXTURED_BG } from '@/lib/bootParams';
import { buildScale, luminance, shade } from '@/lib/color';
import { FONT_SIZE_PX, RADIUS_PX, type HostTheme } from './themeParams';

const FONT_BASE_PX: Record<string, number> = { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 };

const DEFAULT_ACCENT = { light: '#0d9488', dark: '#14b8a6' };

function applyAccent(root: HTMLElement, host: HostTheme) {
  const accent = host.accent ?? (host.dark ? DEFAULT_ACCENT.dark : DEFAULT_ACCENT.light);
  const accent2 = luminance(accent) > 0.75 ? 'var(--text)' : shade(accent, host.dark ? 0.12 : -0.15);
  const accentSoft = `color-mix(in srgb, ${accent} ${host.dark ? 18 : 10}%, transparent)`;
  const scale = buildScale(accent, host.dark ? 7 : 6);

  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-2', accent2);
  root.style.setProperty('--accent-soft', accentSoft);

  scale.forEach((color, i) => {
    root.style.setProperty(`--mantine-color-emerald-${i}`, color);
    root.style.setProperty(`--mantine-primary-color-${i}`, color);
  });

  for (const name of ['emerald', 'primary']) {
    root.style.setProperty(`--mantine-color-${name}-filled`, 'var(--cta)');
    root.style.setProperty(`--mantine-color-${name}-filled-hover`, 'var(--cta-hover)');
    root.style.setProperty(`--mantine-color-${name}-light`, accentSoft);
    root.style.setProperty(`--mantine-color-${name}-light-hover`, accentSoft);
    root.style.setProperty(`--mantine-color-${name}-light-color`, scale[host.dark ? 4 : 6]);
    root.style.setProperty(`--mantine-color-${name}-text`, host.dark ? scale[4] : 'var(--cta)');
    root.style.setProperty(`--mantine-color-${name}-outline`, 'var(--cta)');
    root.style.setProperty(`--mantine-color-${name}-outline-hover`, accentSoft);
  }
}

function applyRadius(root: HTMLElement, px: number) {
  root.style.setProperty('--radius', `${px}px`);
  root.style.setProperty('--radius-sm', `${Math.round(px * 0.7)}px`);
  root.style.setProperty('--radius-lg', `${Math.round(px * 1.25)}px`);
  root.style.setProperty('--mantine-radius-md', `${px}px`);
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
  applyRadius(root, RADIUS_PX[host.radius]);
  applyFontSize(root, FONT_SIZE_PX[host.fontSize]);

  root.setAttribute('data-density', host.density);
  root.setAttribute('data-table-style', host.table);
  root.setAttribute('data-motion', host.motion ? 'on' : 'off');

  if (HOST_TEXTURED_BG) root.setAttribute('data-host-bg', 'textured');
  if (HOST_BG_WASH) root.style.setProperty('--host-bg-wash', HOST_BG_WASH);
}

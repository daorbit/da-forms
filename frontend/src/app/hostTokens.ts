import { HOST_BG_WASH, HOST_TEXTURED_BG } from '@/lib/bootParams';
import { FONT_SIZE_PX, RADIUS_PX, type HostTheme } from './themeParams';

const FONT_BASE_PX: Record<string, number> = { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 };

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

  applyRadius(root, RADIUS_PX[host.radius]);
  applyFontSize(root, FONT_SIZE_PX[host.fontSize]);

  root.setAttribute('data-density', host.density);
  root.setAttribute('data-table-style', host.table);
  root.setAttribute('data-motion', host.motion ? 'on' : 'off');

  if (HOST_TEXTURED_BG) root.setAttribute('data-host-bg', 'textured');
  if (HOST_BG_WASH) root.style.setProperty('--host-bg-wash', HOST_BG_WASH);
}

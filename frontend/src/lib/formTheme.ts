import type { FormTheme } from '@/types';

/** Relative luminance (WCAG-style) to decide whether a background reads as light or dark. */
function isLightColor(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return true;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

/** Text or icon color that stays readable on top of an arbitrary fill. */
export function contrastOn(hex: string): string {
  return isLightColor(hex) ? '#1a1b1e' : '#ffffff';
}

/** The form's resolved body text color: manual override, or auto-picked against the card background. */
export function resolveTextColor(theme?: FormTheme): string | undefined {
  const mode = theme?.textMode ?? 'auto';
  if (mode === 'light') return '#f8f9fa';
  if (mode === 'dark') return '#1a1b1e';
  const surface = theme?.surface === 'flat' && theme.scope !== 'card' ? (theme.pageBg ?? theme.cardBg) : theme?.cardBg;
  if (!surface) return undefined;
  return isLightColor(surface) ? '#1a1b1e' : '#f8f9fa';
}

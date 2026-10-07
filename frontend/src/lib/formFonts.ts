import type { FontFamilyId } from '@/types';

const SANS_FALLBACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const SERIF_FALLBACK = 'Georgia, "Times New Roman", "Noto Serif", serif';

export const FONT_STACKS: Record<FontFamilyId, string> = {
  system: SANS_FALLBACK,
  inter: `Inter, ${SANS_FALLBACK}`,
  serif: SERIF_FALLBACK,
  mono: '"JetBrains Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  rounded: `"Nunito", ui-rounded, "SF Pro Rounded", ${SANS_FALLBACK}`,
  dmSans: `"DM Sans", ${SANS_FALLBACK}`,
  manrope: `Manrope, ${SANS_FALLBACK}`,
  jakarta: `"Plus Jakarta Sans", ${SANS_FALLBACK}`,
  grotesk: `"Space Grotesk", ${SANS_FALLBACK}`,
  playfair: `"Playfair Display", ${SERIF_FALLBACK}`,
  fraunces: `Fraunces, ${SERIF_FALLBACK}`,
};

const GOOGLE_FAMILIES: Partial<Record<FontFamilyId, string>> = {
  inter: 'Inter:wght@400;500;600;700',
  mono: 'JetBrains+Mono:wght@400;500;700',
  rounded: 'Nunito:wght@400;600;700',
  dmSans: 'DM+Sans:wght@400;500;600;700',
  manrope: 'Manrope:wght@400;500;600;700',
  jakarta: 'Plus+Jakarta+Sans:wght@400;500;600;700',
  grotesk: 'Space+Grotesk:wght@400;500;600;700',
  playfair: 'Playfair+Display:wght@400;500;600;700',
  fraunces: 'Fraunces:wght@400;500;600;700',
};

export interface FontOption {
  value: FontFamilyId;
  label: string;
  group: 'Sans' | 'Serif' | 'Other';
}

export const FONT_OPTIONS: FontOption[] = [
  { value: 'system', label: 'System', group: 'Sans' },
  { value: 'inter', label: 'Inter', group: 'Sans' },
  { value: 'dmSans', label: 'DM Sans', group: 'Sans' },
  { value: 'manrope', label: 'Manrope', group: 'Sans' },
  { value: 'jakarta', label: 'Plus Jakarta Sans', group: 'Sans' },
  { value: 'grotesk', label: 'Space Grotesk', group: 'Sans' },
  { value: 'rounded', label: 'Nunito', group: 'Sans' },
  { value: 'serif', label: 'Georgia', group: 'Serif' },
  { value: 'playfair', label: 'Playfair Display', group: 'Serif' },
  { value: 'fraunces', label: 'Fraunces', group: 'Serif' },
  { value: 'mono', label: 'JetBrains Mono', group: 'Other' },
];

const loaded = new Set<FontFamilyId>();

export function ensureFontLoaded(font: FontFamilyId | undefined) {
  if (!font || loaded.has(font) || typeof document === 'undefined') return;
  const family = GOOGLE_FAMILIES[font];
  loaded.add(font);
  if (!family) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
  document.head.appendChild(link);
}

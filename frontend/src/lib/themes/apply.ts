import type { FormTheme } from '@/types';
import type { ThemePreset } from './types';

const LOOK_KEYS: (keyof Omit<FormTheme, 'scope'>)[] = [
  'pageBg',
  'pageBackground',
  'cardBackground',
  'cardRadius',
  'cardShadow',
  'cardOpacity',
  'cardBlur',
  'fontFamily',
  'cardBg',
  'cardBorder',
  'accentColor',
  'labelColor',
  'inputBg',
  'inputBorder',
  'inputTextColor',
  'textMode',
  'fieldStyle',
  'fieldRadius',
  'buttonStyle',
  'buttonShape',
  'density',
  'cardWidth',
  'titleSize',
  'surface',
];

export function presetPatch(preset: ThemePreset): Partial<FormTheme> {
  const cleared = Object.fromEntries(LOOK_KEYS.map((key) => [key, undefined])) as Partial<FormTheme>;
  return { ...cleared, ...preset.theme };
}

export function matchesPreset(theme: FormTheme | undefined, preset: ThemePreset): boolean {
  return (Object.keys(preset.theme) as (keyof typeof preset.theme)[]).every(
    (key) => JSON.stringify(theme?.[key]) === JSON.stringify(preset.theme[key])
  );
}

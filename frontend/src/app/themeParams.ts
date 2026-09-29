import {
  createTheme,
  type MantineColorScheme,
} from '@mantine/core';
import { HEX_COLOR, normalizeHex } from '@/lib/color';
import { theme as baseTheme } from './theme';

export type RadiusStyle = 'rounded' | 'soft' | 'sharp';
export type Density = 'comfortable' | 'compact';
export type FontSize = 'small' | 'default' | 'large';
export type TableStyle = 'plain' | 'striped';

export const RADIUS_PX: Record<RadiusStyle, number> = {
  sharp: 6,
  soft: 11,
  rounded: 16,
};

export const FONT_SIZE_PX: Record<FontSize, number> = {
  small: 13,
  default: 14,
  large: 15.5,
};

export interface HostTheme {
  colorScheme: MantineColorScheme;
  dark: boolean;
  accent: string | null;
  radius: RadiusStyle;
  density: Density;
  fontSize: FontSize;
  table: TableStyle;
  motion: boolean;
}

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readHostTheme(search: string): HostTheme {
  const params = new URLSearchParams(search);
  const colorScheme = pick<MantineColorScheme>(params.get('mode'), ['dark', 'light', 'auto'], 'dark');
  const accent = params.get('accent');

  return {
    colorScheme,
    dark:
      colorScheme === 'dark' ||
      (colorScheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches),
    accent: accent && HEX_COLOR.test(accent) ? normalizeHex(accent) : null,
    radius: pick<RadiusStyle>(params.get('radius'), ['sharp', 'soft', 'rounded'], 'soft'),
    density: pick<Density>(params.get('density'), ['comfortable', 'compact'], 'comfortable'),
    fontSize: pick<FontSize>(params.get('font'), ['small', 'default', 'large'], 'default'),
    table: pick<TableStyle>(params.get('table'), ['plain', 'striped'], 'plain'),
    motion: params.get('motion') !== 'off',
  };
}

export function themeFromHost(_host: HostTheme): ReturnType<typeof createTheme> {
  return baseTheme;
}

import { createTheme, type MantineColorScheme, type MantineColorsTuple } from '@mantine/core';
import { theme as baseTheme } from './theme';

export type RadiusStyle = 'rounded' | 'soft' | 'sharp';

const RADIUS: Record<RadiusStyle, number> = {
  rounded: 12,
  soft: 8,
  sharp: 2,
};

/**
 * A ten-step ramp around one mid-tone, so a host app can pass its own accent
 * as a single hex rather than a whole palette.
 */
function rampFrom(hex: string, colorScheme: MantineColorScheme): MantineColorsTuple {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  const shade = (amount: number) => {
    const target = amount > 0 ? 255 : 0;
    const blend = (channel: number) => Math.round(channel + (target - channel) * Math.abs(amount));
    const to2 = (n: number) => n.toString(16).padStart(2, '0');
    return `#${to2(blend(r))}${to2(blend(g))}${to2(blend(b))}`;
  };

  const steps = [0.92, 0.8, 0.64, 0.44, 0.22, 0.08, -0.14, -0.3, -0.46, -0.6];
  const isDark = colorScheme === 'dark' ||
    (colorScheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const anchor = isDark ? 7 : 6;
  const at = steps[anchor];
  const scale = steps.map((step, index) => {
    if (index === anchor) return `#${value}`;
    const relative = step > at
      ? (step - at) / (steps[0] - at)
      : (step - at) / (at - steps[9]);
    return shade(relative * (step > at ? 0.92 : 0.72));
  });

  return scale as unknown as MantineColorsTuple;
}

export interface ThemeParams {
  colorScheme: MantineColorScheme;
  theme: ReturnType<typeof createTheme>;
}

/**
 * Reads the theme a host app passes on the URL.
 *
 * Every parameter is optional: with none of them the management UI uses its
 * dark theme, while public forms and previews keep their own light surface.
 *
 *   ?mode=dark&accent=%237c3aed&radius=soft&density=compact
 */
export function themeFromParams(search: string): ThemeParams {
  const params = new URLSearchParams(search);

  const mode = params.get('mode');
  const colorScheme: MantineColorScheme =
    mode === 'dark' || mode === 'light' || mode === 'auto' ? mode : 'dark';

  const accent = params.get('accent');
  const radius = params.get('radius') as RadiusStyle | null;
  const density = params.get('density');

  const overrides: Parameters<typeof createTheme>[0] = {};

  if (accent && /^#?[0-9a-fA-F]{6}$/.test(accent)) {
    overrides.colors = { emerald: rampFrom(accent, colorScheme) };
  }

  if (radius && radius in RADIUS) {
    overrides.defaultRadius = RADIUS[radius];
  }

  if (density === 'compact') {
    overrides.spacing = { xs: '8px', sm: '10px', md: '14px', lg: '18px', xl: '24px' };
  }

  return {
    colorScheme,
    theme: createTheme({ ...baseTheme, ...overrides }),
  };
}

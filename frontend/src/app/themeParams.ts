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
function rampFrom(hex: string): MantineColorsTuple {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  // Steps 0-4 lighten toward white, 6-9 darken toward black, 5 is the input.
  const shade = (ratio: number) => {
    const blend = (channel: number) =>
      ratio >= 0
        ? Math.round(channel + (255 - channel) * ratio)
        : Math.round(channel * (1 + ratio));
    const to2 = (n: number) => n.toString(16).padStart(2, '0');
    return `#${to2(blend(r))}${to2(blend(g))}${to2(blend(b))}`;
  };

  return [
    shade(0.92),
    shade(0.8),
    shade(0.6),
    shade(0.4),
    shade(0.2),
    `#${value}`,
    shade(-0.15),
    shade(-0.3),
    shade(-0.45),
    shade(-0.6),
  ] as unknown as MantineColorsTuple;
}

export interface ThemeParams {
  colorScheme: MantineColorScheme;
  theme: ReturnType<typeof createTheme>;
}

/**
 * Reads the theme a host app passes on the URL.
 *
 * Every parameter is optional: with none of them the service looks exactly as
 * it does standalone.
 *
 *   ?mode=dark&accent=%237c3aed&radius=soft&density=compact
 */
export function themeFromParams(search: string): ThemeParams {
  const params = new URLSearchParams(search);

  const mode = params.get('mode');
  const colorScheme: MantineColorScheme =
    mode === 'dark' || mode === 'light' || mode === 'auto' ? mode : 'light';

  const accent = params.get('accent');
  const radius = params.get('radius') as RadiusStyle | null;
  const density = params.get('density');

  const overrides: Parameters<typeof createTheme>[0] = {};

  if (accent && /^#?[0-9a-fA-F]{6}$/.test(accent)) {
    overrides.colors = { emerald: rampFrom(accent) };
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

import {
  createTheme,
  mergeThemeOverrides,
  type MantineColorScheme,
  type MantineColorsTuple,
} from '@mantine/core';
import { theme as baseTheme } from './theme';

export type RadiusStyle = 'rounded' | 'soft' | 'sharp';

const RADIUS: Record<RadiusStyle, number> = {
  rounded: 12,
  soft: 8,
  sharp: 2,
};


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
  /**
   * Readable ink for surfaces painted with the accent itself, or null when the
   * host passed no accent. `autoContrast` covers filled *text*, but components
   * that paint a shape rather than a label — the Switch thumb, which is
   * `--mantine-color-white` on an accent track — need the value directly.
   */
  accentContrast: string | null;
}

/** Perceived brightness of a `#rrggbb` accent, 0–1. */
function accentLuminance(hex: string): number {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}


export function themeFromParams(search: string): ThemeParams {
  const params = new URLSearchParams(search);

  const mode = params.get('mode');
  const colorScheme: MantineColorScheme =
    mode === 'dark' || mode === 'light' || mode === 'auto' ? mode : 'dark';

  const accent = params.get('accent');
  const radius = params.get('radius') as RadiusStyle | null;
  const density = params.get('density');

  const overrides: Parameters<typeof createTheme>[0] = {};
  const LUMINANCE_THRESHOLD = 0.6;
  let accentContrast: string | null = null;

  if (accent && /^#?[0-9a-fA-F]{6}$/.test(accent)) {

    overrides.colors = { ...baseTheme.colors, emerald: rampFrom(accent, colorScheme) };

    // A pale accent needs dark text on top of it. `theme.white` is the wrong
    // knob — Mantine also draws text on every OTHER filled colour with it, so
    // flipping it globally painted red/teal notification titles near-black on
    // a dark card. `autoContrast` picks the readable label per colour instead,
    // so a pale accent gets dark text while a red button keeps white.
    overrides.autoContrast = true;
    overrides.luminanceThreshold = LUMINANCE_THRESHOLD;

    // Same decision, exposed for the shapes `autoContrast` does not reach.
    accentContrast =
      accentLuminance(accent) > LUMINANCE_THRESHOLD ? '#0a0b0d' : '#ffffff';
  }

  if (radius && radius in RADIUS) {
    overrides.defaultRadius = RADIUS[radius];
  }

  if (density === 'compact') {
    overrides.spacing = { xs: '8px', sm: '10px', md: '14px', lg: '18px', xl: '24px' };
  }

  return {
    colorScheme,
    theme: mergeThemeOverrides(baseTheme, overrides),
    accentContrast,
  };
}

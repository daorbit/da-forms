import type { BackgroundLayer, FontFamilyId, FormTheme } from '@/types';

/** Font stacks, keyed by the id stored on the theme. */
export const FONT_STACKS: Record<FontFamilyId, string> = {
  system:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  inter: 'Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", "Noto Serif", serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  rounded: '"Nunito", "Quicksand", ui-rounded, "SF Pro Rounded", "Segoe UI", sans-serif',
};

export const FONT_OPTIONS: { value: FontFamilyId; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'inter', label: 'Inter' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Mono' },
  { value: 'rounded', label: 'Rounded' },
];

export interface GradientPreset {
  id: string;
  name: string;
  value: string;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'dusk', name: 'Dusk', value: 'linear-gradient(135deg, #1e3a8a 0%, #7e22ce 100%)' },
  { id: 'sunrise', name: 'Sunrise', value: 'linear-gradient(135deg, #fb923c 0%, #f43f5e 100%)' },
  { id: 'mint', name: 'Mint', value: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' },
  { id: 'ocean', name: 'Ocean', value: 'linear-gradient(160deg, #0f172a 0%, #0e7490 100%)' },
  { id: 'peach', name: 'Peach', value: 'linear-gradient(135deg, #fde68a 0%, #fca5a5 100%)' },
  { id: 'lilac', name: 'Lilac', value: 'linear-gradient(135deg, #e0e7ff 0%, #fbcfe8 100%)' },
  { id: 'graphite', name: 'Graphite', value: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)' },
  { id: 'aurora', name: 'Aurora', value: 'linear-gradient(120deg, #a7f3d0 0%, #93c5fd 50%, #c4b5fd 100%)' },
  { id: 'ember', name: 'Ember', value: 'linear-gradient(135deg, #7f1d1d 0%, #b45309 100%)' },
  { id: 'paper', name: 'Paper', value: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)' },
  { id: 'radial-glow', name: 'Glow', value: 'radial-gradient(circle at 30% 20%, #38bdf8 0%, #0f172a 70%)' },
  { id: 'candy', name: 'Candy', value: 'linear-gradient(135deg, #f9a8d4 0%, #a5b4fc 100%)' },
];

/** `#rrggbb` plus an opacity percentage, as an `rgba()` string. */
function withAlpha(hex: string, opacityPercent: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(100, opacityPercent)) / 100})`;
}

export function hasBackgroundLayer(layer?: BackgroundLayer): boolean {
  return Boolean(layer?.image || layer?.gradient);
}

/**
 * The layer's CSS, as `background-*` shorthand parts.
 *
 * An image and a gradient can stack: the overlay gradient is listed first so
 * it paints *over* the image, which is how CSS orders multiple backgrounds.
 * The overlay is what keeps a form legible on top of a busy photo.
 */
export function backgroundStyle(
  layer: BackgroundLayer | undefined,
  baseColor: string | undefined,
  options: { allowFixed?: boolean } = {}
): React.CSSProperties {
  if (!layer || (!layer.image && !layer.gradient)) {
    return baseColor ? { backgroundColor: baseColor } : {};
  }

  const images: string[] = [];
  const sizes: string[] = [];
  const positions: string[] = [];
  const repeats: string[] = [];
  const attachments: string[] = [];

  const pushLayer = (image: string, size: string, repeat: string) => {
    images.push(image);
    sizes.push(size);
    positions.push(layer.position ?? 'center');
    repeats.push(repeat);
    attachments.push(options.allowFixed && layer.fixed ? 'fixed' : 'scroll');
  };

  if (layer.overlay && (layer.overlayOpacity ?? 0) > 0) {
    const tint = withAlpha(layer.overlay, layer.overlayOpacity ?? 0);
    pushLayer(`linear-gradient(${tint}, ${tint})`, 'cover', 'no-repeat');
  }

  if (layer.gradient) pushLayer(layer.gradient, 'cover', 'no-repeat');

  if (layer.image) {
    const size = layer.size === 'repeat' ? 'auto' : (layer.size ?? 'cover');
    pushLayer(`url("${layer.image}")`, size, layer.size === 'repeat' ? 'repeat' : 'no-repeat');
  }

  return {
    backgroundColor: baseColor,
    backgroundImage: images.join(', '),
    backgroundSize: sizes.join(', '),
    backgroundPosition: positions.join(', '),
    backgroundRepeat: repeats.join(', '),
    backgroundAttachment: attachments.join(', '),
  };
}

const SHADOWS: Record<NonNullable<FormTheme['cardShadow']>, string> = {
  none: 'none',
  sm: '0 1px 3px rgba(0,0,0,0.10)',
  md: '0 6px 18px rgba(0,0,0,0.12)',
  lg: '0 14px 40px rgba(0,0,0,0.18)',
  xl: '0 28px 70px rgba(0,0,0,0.28)',
};

export function cardShadowValue(shadow: FormTheme['cardShadow']): string | undefined {
  return shadow ? SHADOWS[shadow] : undefined;
}

/**
 * The card's own surface style. Opacity is applied to the *background color*
 * rather than the element, because `opacity` would fade the form's text and
 * inputs along with it — and a translucent card is only useful if what's on
 * it stays readable.
 */
export function cardSurfaceStyle(theme?: FormTheme): React.CSSProperties {
  if (!theme) return {};
  const opacity = theme.cardOpacity ?? 100;
  const baseColor =
    theme.cardBg && opacity < 100 ? withAlpha(theme.cardBg, opacity) : theme.cardBg;

  const style: React.CSSProperties = {
    ...backgroundStyle(theme.cardBackground, baseColor),
    borderColor: theme.cardBorder,
  };
  if (theme.cardRadius !== undefined) style.borderRadius = theme.cardRadius;
  const shadow = cardShadowValue(theme.cardShadow);
  if (shadow) style.boxShadow = shadow;
  if (theme.cardBlur) style.backdropFilter = `blur(${theme.cardBlur}px)`;
  if (theme.fontFamily) style.fontFamily = FONT_STACKS[theme.fontFamily];
  return style;
}

/** The page behind the card, on the standalone share link. */
export function pageSurfaceStyle(theme?: FormTheme): React.CSSProperties {
  return backgroundStyle(theme?.pageBackground, theme?.pageBg, { allowFixed: true });
}

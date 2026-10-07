import type { CSSProperties } from 'react';
import type { ButtonStyle, CardWidth, FormDensity, FormTheme, TitleSize } from '@/types';

const DENSITY_GAP: Record<FormDensity, string> = {
  compact: 'sm',
  comfortable: 'md',
  spacious: 'xl',
};

const DENSITY_PADDING: Record<FormDensity, string> = {
  compact: '24px',
  comfortable: '32px',
  spacious: '48px',
};

const DENSITY_INPUT_HEIGHT: Record<FormDensity, string> = {
  compact: '34px',
  comfortable: '40px',
  spacious: '48px',
};

const CARD_WIDTH: Record<CardWidth, number> = {
  narrow: 560,
  regular: 720,
  wide: 880,
};

const TITLE_SIZE: Record<TitleSize, number> = {
  sm: 20,
  md: 24,
  lg: 30,
  xl: 38,
};

const BUTTON_VARIANT: Record<ButtonStyle, 'filled' | 'light' | 'outline'> = {
  solid: 'filled',
  soft: 'light',
  outline: 'outline',
};

export function fieldGap(theme?: FormTheme): string {
  return DENSITY_GAP[theme?.density ?? 'comfortable'];
}

export function containerWidth(theme?: FormTheme): number | undefined {
  return theme?.cardWidth ? CARD_WIDTH[theme.cardWidth] : undefined;
}

export function titleSize(theme?: FormTheme): number | undefined {
  return theme?.titleSize ? TITLE_SIZE[theme.titleSize] : undefined;
}

export function buttonVariant(theme?: FormTheme): 'filled' | 'light' | 'outline' {
  return BUTTON_VARIANT[theme?.buttonStyle ?? 'solid'];
}

export function buttonRadius(theme?: FormTheme): number | undefined {
  if (theme?.buttonShape === 'pill') return 999;
  return theme?.fieldRadius;
}

export function skinAttributes(theme?: FormTheme): Record<string, string | undefined> {
  return {
    'data-field-style': theme?.fieldStyle,
    'data-radius': theme?.fieldRadius !== undefined ? '' : undefined,
    'data-density': theme?.density,
    'data-surface': theme?.surface,
    'data-title-size': theme?.titleSize,
  };
}

export function skinVars(theme?: FormTheme): CSSProperties {
  const vars: Record<string, string> = {};
  if (theme?.fieldRadius !== undefined) vars['--fs-radius'] = `${theme.fieldRadius}px`;
  if (theme?.accentColor) vars['--fs-accent'] = theme.accentColor;
  if (theme?.cardWidth) vars['--fs-width'] = `${CARD_WIDTH[theme.cardWidth]}px`;
  if (theme?.density) {
    vars['--fs-pad'] = DENSITY_PADDING[theme.density];
    vars['--fs-input-h'] = DENSITY_INPUT_HEIGHT[theme.density];
  }
  return vars as CSSProperties;
}

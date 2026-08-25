import { solidPresets } from './solid';
import { tintedPresets } from './tinted';
import { designedPresets } from './designed';

export type { ThemePreset } from './types';

/** Every preset offered in the theme picker, plainest first. */
export const THEME_PRESETS = [...designedPresets, ...tintedPresets, ...solidPresets];

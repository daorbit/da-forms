import { solidPresets } from './solid';
import { tintedPresets } from './tinted';
import { designedPresets } from './designed';
import { studioPresets } from './studio';

export type { ThemePreset } from './types';
export { presetPatch, matchesPreset } from './apply';

export const THEME_PRESETS = [...studioPresets, ...designedPresets, ...tintedPresets, ...solidPresets];

import type { FormTheme } from '@/types';

export interface ThemePreset {
  id: string;
  name: string;
  /** Applied over the form's current theme, keeping its scope. */
  theme: Omit<FormTheme, 'scope'>;
}

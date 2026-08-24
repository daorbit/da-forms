import { createTheme, rem } from '@mantine/core';

/**
 * Matches the Quantalog app's theme: emerald accent, Inter, flat surfaces —
 * so an embedded form and its builder read as part of the same product.
 */
export const theme = createTheme({
  primaryColor: 'emerald',
  primaryShade: { light: 6, dark: 7 },
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontFamilyMonospace: "ui-monospace, 'SF Mono', Menlo, monospace",
  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: rem(30), lineHeight: '1.2' },
      h2: { fontSize: rem(23), lineHeight: '1.25' },
      h3: { fontSize: rem(18), lineHeight: '1.3' },
    },
  },
  defaultRadius: 'md',
  cursorType: 'pointer',
  colors: {
    emerald: [
      '#ecfdf5',
      '#d1fae5',
      '#a7f3d0',
      '#6ee7b7',
      '#34d399',
      '#10b981',
      '#059669',
      '#047857',
      '#065f46',
      '#064e3b',
    ],
    // Matched to the host app's own surfaces: text, then muted tones, then
    // borders, then the card and shell fills at 6-9. Cards sit a step above
    // the shell rather than below it, or they read as holes in the page.
    dark: [
      '#f2f4f6',
      '#a9afba',
      '#6d737e',
      '#34383e',
      '#26292e',
      '#1c1f23',
      '#16181b',
      '#111316',
      '#0e0f12',
      '#0b0c0e',
    ],
  },
  shadows: {
    md: '0 8px 24px -8px rgba(0,0,0,0.45)',
    lg: '0 16px 40px -12px rgba(0,0,0,0.55)',
  },
  components: {
    Tooltip: {
      defaultProps: { color: 'dark.8' },
    },
    Loader: { defaultProps: { type: 'oval' } },
    Card: { defaultProps: { radius: 'md' } },
    Button: { defaultProps: { radius: 'md' } },
    Paper: { defaultProps: { radius: 'md' } },
    Input: { defaultProps: { radius: 8 } },
    TextInput: { defaultProps: { radius: 8 } },
    Select: { defaultProps: { radius: 8 } },
    Textarea: { defaultProps: { radius: 8 } },
    NumberInput: { defaultProps: { radius: 8 } },
  },
});
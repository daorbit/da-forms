import { createTheme, rem } from '@mantine/core';

 
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
 
    /*
     * A dark tooltip in both schemes, with light text to match.
     *
     * The label colour has to be stated rather than inherited: `--mantine-color-text`
     * follows the scheme, so on a light page it resolved to near-black and put
     * dark text on the dark tooltip.
     */
    Tooltip: {
      defaultProps: { color: 'dark.8' },
      styles: { tooltip: { color: 'var(--mantine-color-white)' } },
    },

    /*
     * The selected segment, in whichever scheme is showing.
     *
     * `dark-4` is a dark grey in both schemes — Mantine's `dark` palette does
     * not flip — so on a light page the indicator was a near-black pill under
     * near-black text. `light-dark()` picks a raised surface for light and the
     * same grey as before for dark, and the active label takes whatever sits
     * legibly on it.
     */
    SegmentedControl: {
      styles: {
        indicator: {
          backgroundColor: 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-4))',
          boxShadow: 'light-dark(0 1px 3px rgba(0, 0, 0, 0.12), none)',
        },
        label: {
          color: 'var(--mantine-color-dimmed)',
          '&[data-active]': {
            color: 'light-dark(var(--mantine-color-black), var(--mantine-color-white))',
          },
        },
      },
    },
 
 
    /*
     * Toasts, in whichever scheme is showing.
     *
     * Mantine derives the notification surface from the `dark` palette, which
     * this theme replaces with its own near-black scale — so in light mode the
     * toast painted white while its text still resolved against that scale and
     * came out invisible. Stating both ends of the pair fixes it in both
     * schemes, and the close button has to be told separately because it does
     * not inherit from the body.
     */
    Notification: {
      styles: {
        root: {
          backgroundColor: 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-6))',
          borderColor: 'var(--mantine-color-default-border)',
        },
        title: { color: 'light-dark(var(--mantine-color-black), var(--mantine-color-white))' },
        // Most toasts here are a bare `message` with no title, and that renders
        // into `description` — so this is the primary text more often than not
        // and cannot be dimmed.
        description: {
          color: 'light-dark(var(--mantine-color-black), var(--mantine-color-white))',
        },
        closeButton: {
          color: 'var(--mantine-color-dimmed)',
          '&:hover': {
            backgroundColor: 'var(--mantine-color-default-hover)',
          },
        },
      },
    },

    Alert: {
      styles: { message: { color: 'var(--mantine-color-text)' } },
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
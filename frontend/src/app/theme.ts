import { ActionIcon, Button, createTheme, rem } from '@mantine/core';

 
export const theme = createTheme({
  primaryColor: 'emerald',
  primaryShade: { light: 6, dark: 5 },
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
      '#f0fdfa',
      '#ccfbf1',
      '#99f6e4',
      '#5eead4',
      '#2dd4bf',
      '#14b8a6',
      '#0d9488',
      '#0f766e',
      '#115e59',
      '#134e4a',
    ],
 
    dark: [
      '#f5f5f5',
      '#d4d4d4',
      '#a3a3a3',
      '#737373',
      '#3a3a3a',
      '#292929',
      '#1c1c1c',
      '#161616',
      '#111111',
      '#000000',
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
    Button: Button.extend({
      defaultProps: { radius: 'md' },
      vars: (_theme, props) =>
        (props.variant === undefined || props.variant === 'filled') &&
        (!props.color || props.color === 'emerald')
          ? {
              root: {
                '--button-bg': 'var(--cta)',
                '--button-hover': 'var(--cta-hover)',
                '--button-color': 'var(--cta-fg)',
                '--button-hover-color': 'var(--cta-fg)',
              },
            }
          : { root: {} },
    }),
    ActionIcon: ActionIcon.extend({
      vars: (_theme, props) =>
        props.variant === 'filled' && (!props.color || props.color === 'emerald')
          ? {
              root: {
                '--ai-bg': 'var(--cta)',
                '--ai-hover': 'var(--cta-hover)',
                '--ai-color': 'var(--cta-fg)',
                '--ai-hover-color': 'var(--cta-fg)',
              },
            }
          : { root: {} },
    }),
    Paper: { defaultProps: { radius: 'md' } },
    Input: { defaultProps: { radius: 8 } },
    TextInput: { defaultProps: { radius: 8 } },
    Select: { defaultProps: { radius: 8 } },
    Textarea: { defaultProps: { radius: 8 } },
    NumberInput: { defaultProps: { radius: 8 } },
  },
});
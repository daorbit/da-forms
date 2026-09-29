import { ActionIcon, Badge, Button, createTheme, rem, type MantineColorsTuple } from '@mantine/core';

const NEUTRAL_BADGE_COLORS = ['gray', 'dark'];
const NEUTRAL_RAMP: MantineColorsTuple = [
  '#f5f5f5',
  '#d4d4d4',
  '#a3a3a3',
  '#737373',
  '#525252',
  '#3a3a3a',
  '#292929',
  '#1c1c1c',
  '#111111',
  '#000000',
];

function badgeTextColor(color: string | undefined, themeColors: Record<string, unknown>): string {
  if (!color) return 'var(--mantine-color-emerald-text)';
  if (NEUTRAL_BADGE_COLORS.includes(color)) return 'var(--mantine-color-dimmed)';
  const [name] = color.split('.');
  return name in themeColors ? `var(--mantine-color-${name}-text)` : color;
}

export const theme = createTheme({
  primaryColor: 'emerald',
  black: '#0a0b0d',
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
    emerald: NEUTRAL_RAMP,
    green: NEUTRAL_RAMP,
    teal: NEUTRAL_RAMP,
    dark: NEUTRAL_RAMP,
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
 
 
    Alert: {
      styles: { message: { color: 'var(--mantine-color-text)' } },
    },
    Loader: { defaultProps: { type: 'oval' } },
    Skeleton: { defaultProps: { className: 'skeleton-shimmer' } },
    Badge: Badge.extend({
      vars: (theme, props) => ({
        root: {
          '--badge-bg': 'transparent',
          '--badge-bd': 'none',
          '--badge-radius': '0',
          '--badge-color': badgeTextColor(props.color, theme.colors),
        },
      }),
      styles: {
        root: {
          paddingInline: 0,
          textTransform: 'none',
          fontWeight: 650,
          height: 'auto',
          lineHeight: 1.35,
          letterSpacing: '0.01em',
          fontVariantNumeric: 'tabular-nums',
        },
      },
    }),
    Switch: {
      vars: () => ({
        root: {
          '--switch-bg': 'var(--surface-2)',
          '--switch-bd': '1px solid var(--border)',
          '--switch-thumb-bg': 'var(--control-thumb, var(--text))',
        },
      }),
    },
    Checkbox: {
      vars: () => ({
        root: {
          '--checkbox-bd': '1px solid var(--border)',
        },
      }),
    },
    Radio: {
      vars: () => ({
        root: {
          '--radio-bd': '1px solid var(--border)',
        },
      }),
    },
    Modal: {
      defaultProps: {
        radius: 24,
        centered: true,
        overlayProps: { backgroundOpacity: 0.5, blur: 8 },
        transitionProps: { transition: 'pop', duration: 200 },
      },
    },
    Menu: {
      defaultProps: {
        radius: 14,
        shadow: 'lg',
        transitionProps: { transition: 'pop', duration: 140 },
      },
    },
    Popover: { defaultProps: { radius: 14, shadow: 'lg' } },
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
    PasswordInput: { defaultProps: { radius: 8 } },
    Select: { defaultProps: { radius: 8 } },
    Textarea: { defaultProps: { radius: 8 } },
    NumberInput: { defaultProps: { radius: 8 } },
  },
});
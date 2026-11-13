import { ActionIcon, Alert, Badge, Button, createTheme, Pagination, rem, ThemeIcon } from '@mantine/core';

const NEUTRAL_BADGE_COLORS = ['gray', 'dark'];

const DROPDOWN_DEFAULTS = {
  checkIconPosition: 'right' as const,
  maxDropdownHeight: 340,
  comboboxProps: {
    radius: 'lg',
    shadow: 'lg',
    offset: 6,
    transitionProps: { transition: 'pop' as const, duration: 140 },
  },
};

const DROPDOWN_CLASSES = {
  dropdown: 'app-combobox-dropdown',
  option: 'app-combobox-option',
  group: 'app-combobox-group',
  groupLabel: 'app-combobox-group-label',
};

function badgeTextColor(color: string | undefined, themeColors: Record<string, unknown>): string {
  if (!color) return 'var(--mantine-color-emerald-text)';
  if (NEUTRAL_BADGE_COLORS.includes(color)) return 'var(--mantine-color-dimmed)';
  const [name] = color.split('.');
  return name in themeColors ? `var(--mantine-color-${name}-text)` : color;
}

export const theme = createTheme({
  primaryColor: 'emerald',
  primaryShade: { light: 6, dark: 6 },
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontFamilyMonospace: "ui-monospace, 'SF Mono', Menlo, monospace",
  headings: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontWeight: '600',
    sizes: {
      h1: { fontSize: rem(33), lineHeight: '1.21' },
      h2: { fontSize: rem(24), lineHeight: '1.25' },
      h3: { fontSize: rem(17), lineHeight: '1.4' },
    },
  },
  defaultRadius: 'md',
  radius: { xs: rem(4), sm: rem(4), md: rem(8), lg: rem(12), xl: rem(20) },
  spacing: { xs: rem(8), sm: rem(12), md: rem(16), lg: rem(24), xl: rem(32) },
  fontSizes: { xs: rem(12), sm: rem(15), md: rem(17), lg: rem(20), xl: rem(24) },
  cursorType: 'pointer',
  colors: {
    gray: [
      '#f8f8fa', '#f2f2f4', '#e9e9ed', '#dedee3', '#d2d2d7',
      '#aeaeb2', '#86868b', '#48484a', '#333336', '#1d1d1f',
    ],
    emerald: [
      '#e6f0fd', '#cce2fb', '#99c5f6', '#66a8f1', '#338ced',
      '#1a7fe8', '#0071e3', '#0066cc', '#0058b0', '#00305f',
    ],
    dark: [
      '#d1d1d6', '#aeaeb2', '#8e8e93', '#636366', '#333336',
      '#222224', '#1a1a1c', '#121214', '#0b0b0c', '#000000',
    ],
  },
  shadows: {
    md: 'var(--shadow)',
    lg: 'var(--shadow-lg)',
  },
  components: {
    Loader: { defaultProps: { type: 'oval' } },
    Alert: Alert.extend({
      defaultProps: { radius: 'lg', variant: 'light' },
      vars: () => ({
        root: {
          '--alert-bg': 'var(--surface-2)',
          '--alert-bd': '1px solid var(--border)',
        },
      }),
    }),
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
      vars: (_theme: unknown, props: { color?: string }) => ({
        root: {
          '--switch-bg': 'color-mix(in srgb, var(--text) 18%, transparent)',
          '--switch-bd': '1px solid transparent',
          '--switch-thumb-bg': '#ffffff',
          ...(props.color ? {} : { '--switch-color': 'var(--accent)' }),
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
    ThemeIcon: ThemeIcon.extend({
      vars: (_theme, props) =>
        props.variant === 'filled' && (!props.color || props.color === 'emerald')
          ? { root: { '--ti-color': 'var(--accent-contrast)' } }
          : { root: {} },
    }),
    Modal: {
      defaultProps: {
        radius: 'xl',
        centered: true,
        overlayProps: { backgroundOpacity: 0.4, blur: 6 },
        transitionProps: { transition: 'pop', duration: 180 },
      },
    },
    Drawer: { defaultProps: { overlayProps: { backgroundOpacity: 0.4, blur: 6 } } },
    Menu: {
      defaultProps: {
        radius: 'lg',
        shadow: 'lg',
        transitionProps: { transition: 'pop', duration: 140 },
      },
    },
    Popover: { defaultProps: { radius: 'lg', shadow: 'lg' } },
    Tooltip: { defaultProps: { radius: 'sm', openDelay: 300 } },
    Card: { defaultProps: { radius: 'md' } },
    Anchor: { defaultProps: { c: 'var(--accent-text)' } },
    Button: Button.extend({
      defaultProps: { radius: 'md' },
      styles: { label: { fontWeight: 550, letterSpacing: '-0.01em' } },
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
        (props.variant === undefined || props.variant === 'filled') &&
        (!props.color || props.color === 'emerald')
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
    Pagination: Pagination.extend({
      vars: (_theme, props) =>
        !props.color || props.color === 'emerald'
          ? {
              root: {
                '--pagination-active-bg': 'var(--cta)',
                '--pagination-active-color': 'var(--cta-fg)',
              },
            }
          : { root: {} },
    }),
    Paper: { defaultProps: { radius: 'md' } },
    Input: { defaultProps: { radius: 8 } },
    TextInput: { defaultProps: { radius: 8 } },
    PasswordInput: { defaultProps: { radius: 8 } },
    Textarea: { defaultProps: { radius: 8 } },
    NumberInput: { defaultProps: { radius: 8 } },
    Select: { defaultProps: { radius: 8, ...DROPDOWN_DEFAULTS }, classNames: DROPDOWN_CLASSES },
    MultiSelect: { defaultProps: DROPDOWN_DEFAULTS, classNames: DROPDOWN_CLASSES },
    Autocomplete: { defaultProps: { comboboxProps: DROPDOWN_DEFAULTS.comboboxProps }, classNames: DROPDOWN_CLASSES },
    TagsInput: { defaultProps: { comboboxProps: DROPDOWN_DEFAULTS.comboboxProps }, classNames: DROPDOWN_CLASSES },
  },
});

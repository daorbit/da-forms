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
  fontFamily: "'Google Sans Flex', ui-sans-serif, system-ui, -apple-system, sans-serif",
  fontFamilyMonospace: "ui-monospace, 'SF Mono', Menlo, monospace",
  headings: {
    fontFamily: "'Google Sans Flex', ui-sans-serif, system-ui, sans-serif",
    fontWeight: '650',
    sizes: {
      h1: { fontSize: rem(26), lineHeight: '1.2' },
      h2: { fontSize: rem(20), lineHeight: '1.25' },
      h3: { fontSize: rem(16), lineHeight: '1.35' },
    },
  },
  defaultRadius: 'md',
  radius: { xs: rem(4), sm: rem(6), md: rem(8), lg: rem(12), xl: rem(16) },
  spacing: { xs: rem(8), sm: rem(12), md: rem(16), lg: rem(24), xl: rem(32) },
  cursorType: 'pointer',
  colors: {
    emerald: [
      '#eef3ff', '#dce6ff', '#b5c8ff', '#8fadff', '#5f8bff',
      '#4776ff', '#2f6bff', '#255fef', '#1f55d6', '#142c66',
    ],
    dark: [
      '#d4d5da', '#b0b2ba', '#8a8c95', '#6b6d76', '#303137',
      '#222327', '#1c1d21', '#16171a', '#111214', '#0b0c0e',
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
    Card: { defaultProps: { radius: 'lg' } },
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
    Paper: { defaultProps: { radius: 'lg' } },
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

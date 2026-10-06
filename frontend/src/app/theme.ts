import { ActionIcon, Badge, Button, createTheme, Pagination, rem, ThemeIcon } from '@mantine/core';

const NEUTRAL_BADGE_COLORS = ['gray', 'dark'];

const DROPDOWN_DEFAULTS = {
  checkIconPosition: 'right' as const,
  maxDropdownHeight: 340,
  comboboxProps: {
    radius: 12,
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
  primaryShade: { light: 6, dark: 7 },
  fontFamily: "'Google Sans Flex', ui-sans-serif, system-ui, -apple-system, sans-serif",
  fontFamilyMonospace: "ui-monospace, 'SF Mono', Menlo, monospace",
  headings: {
    fontFamily: "'Google Sans Flex', ui-sans-serif, system-ui, sans-serif",
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
      '#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399',
      '#10b981', '#059669', '#047857', '#065f46', '#064e3b',
    ],
    dark: [
      '#c9c9c9', '#a8a8a8', '#8a8a8a', '#5e5e5e', '#2c2c2c',
      '#242424', '#1c1c1c', '#161616', '#0f0f0f', '#0a0a0a',
    ],
  },
  shadows: {
    md: '0 8px 24px -8px rgba(0,0,0,0.45)',
    lg: '0 16px 40px -12px rgba(0,0,0,0.55)',
  },
  components: {
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
    ThemeIcon: ThemeIcon.extend({
      vars: (_theme, props) =>
        props.variant === 'filled' && (!props.color || props.color === 'emerald')
          ? { root: { '--ti-color': 'var(--accent-contrast)' } }
          : { root: {} },
    }),
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

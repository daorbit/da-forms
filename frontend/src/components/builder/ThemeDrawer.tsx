import { Drawer, Stack, Text, SegmentedControl, ColorInput, Divider, Tabs, Slider, Select } from '@mantine/core';
import type { BackgroundLayer, FontFamilyId, FormTheme } from '@/types';
import { BackgroundEditor } from './BackgroundEditor';
import { FONT_OPTIONS } from '@/lib/formBackground';
import classes from './drawer.module.css';

interface Props {
  opened: boolean;
  onClose: () => void;
  theme: FormTheme;
  onChange: (patch: Partial<FormTheme>) => void;
}

const SWATCHES = [
  '#0f1115',
  '#1a1b1e',
  '#0b3d2e',
  '#0ca678',
  '#1971c2',
  '#7048e8',
  '#e64980',
  '#f08c00',
  '#ffffff',
  '#f8f9fa',
];

export function ThemeDrawer({ opened, onClose, theme, onChange }: Props) {
  const scope = theme.scope ?? 'page';

  /** Merges into one background layer without disturbing the other. */
  const patchLayer = (key: 'pageBackground' | 'cardBackground') => (patch: Partial<BackgroundLayer>) =>
    onChange({ [key]: { ...(theme[key] ?? {}), ...patch } });

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={480}
      title="Theme"
      padding="lg"
      classNames={classes}
    >
      <Tabs defaultValue="colors" keepMounted={false}>
        <Tabs.List grow mb="lg">
          <Tabs.Tab value="colors">Colors</Tabs.Tab>
          <Tabs.Tab value="background">Background</Tabs.Tab>
          <Tabs.Tab value="card">Card &amp; type</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="colors">
          <Stack gap="xl">
            <div>
              <Text size="sm" fw={500} mb={8}>
                Where this form lives
              </Text>
              <SegmentedControl
                fullWidth
                value={scope}
                onChange={(value) => onChange({ scope: value as FormTheme['scope'] })}
                data={[
                  { value: 'page', label: 'Standalone link' },
                  { value: 'card', label: 'Embedded on a site' },
                ]}
              />
              <Text size="xs" c="dimmed" mt={6}>
                {scope === 'page'
                  ? 'The page background applies to the full share-link page.'
                  : "Embedded forms sit on the host page's own background — only the card itself is themed."}
              </Text>
            </div>

            <Divider />

            {scope === 'page' && (
              <ColorInput
                label="Page background"
                description="Behind the card, on the standalone share-link page"
                placeholder="#0f1115"
                value={theme.pageBg ?? ''}
                onChange={(value) => onChange({ pageBg: value })}
                swatches={SWATCHES}
              />
            )}

            <ColorInput
              label="Card background"
              value={theme.cardBg ?? ''}
              onChange={(value) => onChange({ cardBg: value })}
              swatches={SWATCHES}
            />

            <ColorInput
              label="Card border"
              value={theme.cardBorder ?? ''}
              onChange={(value) => onChange({ cardBorder: value })}
              swatches={SWATCHES}
            />

            <ColorInput
              label="Submit button color"
              description="Also used for focus rings and other interactive highlights"
              placeholder="#0ca678"
              value={theme.accentColor ?? ''}
              onChange={(value) => onChange({ accentColor: value })}
              swatches={SWATCHES}
            />

            <ColorInput
              label="Label color"
              description="Field labels — leave empty to match the text color below"
              value={theme.labelColor ?? ''}
              onChange={(value) => onChange({ labelColor: value })}
              swatches={SWATCHES}
            />

            <Divider label="Input fields" labelPosition="left" />

            <ColorInput
              label="Input background"
              value={theme.inputBg ?? ''}
              onChange={(value) => onChange({ inputBg: value })}
              swatches={SWATCHES}
            />

            <ColorInput
              label="Input border"
              value={theme.inputBorder ?? ''}
              onChange={(value) => onChange({ inputBorder: value })}
              swatches={SWATCHES}
            />

            <ColorInput
              label="Input text color"
              description="Text typed into fields — leave empty to match the text color below"
              value={theme.inputTextColor ?? ''}
              onChange={(value) => onChange({ inputTextColor: value })}
              swatches={SWATCHES}
            />

            <div>
              <Text size="sm" fw={500} mb={8}>
                Text color
              </Text>
              <SegmentedControl
                fullWidth
                value={theme.textMode ?? 'auto'}
                onChange={(value) => onChange({ textMode: value as FormTheme['textMode'] })}
                data={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
              />
              <Text size="xs" c="dimmed" mt={6}>
                Auto picks light or dark text based on the card background's brightness.
              </Text>
            </div>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="background">
          <Stack gap="xl">
            {scope === 'page' ? (
              <div>
                <Text size="sm" fw={600} mb={4}>
                  Page background
                </Text>
                <Text size="xs" c="dimmed" mb="md">
                  Painted over the page color, behind the form card.
                </Text>
                <BackgroundEditor
                  layer={theme.pageBackground ?? {}}
                  onChange={patchLayer('pageBackground')}
                  allowFixed
                />
              </div>
            ) : (
              <Text size="xs" c="dimmed">
                An embedded form has no page of its own — the host site's background shows behind it. Style the card
                background below instead.
              </Text>
            )}

            <Divider />

            <div>
              <Text size="sm" fw={600} mb={4}>
                Card background
              </Text>
              <Text size="xs" c="dimmed" mb="md">
                Painted over the card color, behind the fields.
              </Text>
              <BackgroundEditor layer={theme.cardBackground ?? {}} onChange={patchLayer('cardBackground')} />
            </div>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="card">
          <Stack gap="xl">
            <Select
              label="Font"
              description="Applied across the whole form"
              value={theme.fontFamily ?? 'system'}
              onChange={(value) => onChange({ fontFamily: (value ?? 'system') as FontFamilyId })}
              data={FONT_OPTIONS}
              allowDeselect={false}
            />

            <Select
              label="Card shadow"
              value={theme.cardShadow ?? 'none'}
              onChange={(value) => onChange({ cardShadow: (value ?? 'none') as FormTheme['cardShadow'] })}
              data={[
                { value: 'none', label: 'None' },
                { value: 'sm', label: 'Subtle' },
                { value: 'md', label: 'Medium' },
                { value: 'lg', label: 'Large' },
                { value: 'xl', label: 'Dramatic' },
              ]}
              allowDeselect={false}
            />

            <div>
              <Text size="sm" fw={500} mb={8}>
                Corner radius — {theme.cardRadius ?? 8}px
              </Text>
              <Slider
                value={theme.cardRadius ?? 8}
                onChange={(value) => onChange({ cardRadius: value })}
                min={0}
                max={48}
                step={1}
              />
            </div>

            <div>
              <Text size="sm" fw={500} mb={8}>
                Card opacity — {theme.cardOpacity ?? 100}%
              </Text>
              <Slider
                value={theme.cardOpacity ?? 100}
                onChange={(value) => onChange({ cardOpacity: value })}
                min={20}
                max={100}
                step={5}
              />
              <Text size="xs" c="dimmed" mt={6}>
                Below 100% the page background shows through the card.
              </Text>
            </div>

            <div>
              <Text size="sm" fw={500} mb={8}>
                Frosted glass blur — {theme.cardBlur ?? 0}px
              </Text>
              <Slider
                value={theme.cardBlur ?? 0}
                onChange={(value) => onChange({ cardBlur: value })}
                min={0}
                max={40}
                step={1}
              />
              <Text size="xs" c="dimmed" mt={6}>
                Blurs whatever sits behind a translucent card. No effect at 100% opacity.
              </Text>
            </div>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Drawer>
  );
}

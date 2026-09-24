import { SegmentedControl, Select, Slider, Tabs, Text } from '@mantine/core';
import { IconPalette } from '@tabler/icons-react';
import type { BackgroundLayer, FontFamilyId, FormTheme } from '@/types';
import { BackgroundEditor } from './BackgroundEditor';
import { FONT_OPTIONS } from '@/lib/formBackground';
import { SettingsDrawer } from './settings/SettingsDrawer';
import { SettingsGroup, SettingRow, SettingsStack } from './settings/SettingsGroup';
import { ChoiceCards } from './settings/ChoiceCards';
import { ColorRow, SwatchPicker } from './settings/ColorRow';

interface Props {
  opened: boolean;
  onClose: () => void;
  theme: FormTheme;
  onChange: (patch: Partial<FormTheme>) => void;
}

const ACCENTS = [
  { color: '#0ca678', name: 'Emerald' },
  { color: '#1971c2', name: 'Blue' },
  { color: '#7048e8', name: 'Violet' },
  { color: '#e64980', name: 'Pink' },
  { color: '#f08c00', name: 'Orange' },
  { color: '#e03131', name: 'Red' },
  { color: '#0f1115', name: 'Black' },
];

const SCOPES = [
  { value: 'page' as const, label: 'Standalone link', hint: 'A full page with its own background.' },
  { value: 'card' as const, label: 'Embedded on a site', hint: "Only the card. Your site's background shows behind it." },
];

function SliderRow({
  label,
  hint,
  value,
  unit,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <SettingRow stacked label={`${label} · ${value}${unit}`} hint={hint}>
      <Slider value={value} onChange={onChange} min={min} max={max} step={step} color="emerald" label={null} />
    </SettingRow>
  );
}

export function ThemeDrawer({ opened, onClose, theme, onChange }: Props) {
  const scope = theme.scope ?? 'page';

  const patchLayer = (key: 'pageBackground' | 'cardBackground') => (patch: Partial<BackgroundLayer>) =>
    onChange({ [key]: { ...(theme[key] ?? {}), ...patch } });

  return (
    <SettingsDrawer
      opened={opened}
      onClose={onClose}
      title="Theme"
      subtitle="Colours, background and style of your form."
      icon={<IconPalette size={18} stroke={1.7} />}
    >
      <SettingsGroup title="Where will this form live?">
        <SettingRow stacked>
          <ChoiceCards
            ariaLabel="Where this form lives"
            value={scope}
            onChange={(value) => onChange({ scope: value })}
            choices={SCOPES}
          />
        </SettingRow>
      </SettingsGroup>

      <Tabs defaultValue="colors" keepMounted={false}>
        <Tabs.List grow mb="md">
          <Tabs.Tab value="colors">Colours</Tabs.Tab>
          <Tabs.Tab value="background">Background</Tabs.Tab>
          <Tabs.Tab value="style">Style</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="colors">
          <SettingsStack>
            <SettingsGroup title="Button" hint="Also used for focus rings and other highlights.">
              <SettingRow stacked>
                <SwatchPicker
                  value={theme.accentColor}
                  options={ACCENTS}
                  onChange={(value) => onChange({ accentColor: value })}
                />
              </SettingRow>
              <ColorRow
                label="Custom colour"
                value={theme.accentColor}
                placeholder="#0ca678"
                onChange={(value) => onChange({ accentColor: value })}
              />
            </SettingsGroup>

            <SettingsGroup title="Form card">
              {scope === 'page' && (
                <ColorRow
                  label="Page"
                  hint="Behind the card on the share link."
                  value={theme.pageBg}
                  onChange={(value) => onChange({ pageBg: value })}
                />
              )}
              <ColorRow label="Card" value={theme.cardBg} onChange={(value) => onChange({ cardBg: value })} />
              <ColorRow
                label="Border"
                value={theme.cardBorder}
                onChange={(value) => onChange({ cardBorder: value })}
              />
            </SettingsGroup>

            <SettingsGroup title="Text">
              <SettingRow label="Text colour" hint="Auto picks light or dark based on the card.">
                <SegmentedControl
                  size="xs"
                  value={theme.textMode ?? 'auto'}
                  onChange={(value) => onChange({ textMode: value as FormTheme['textMode'] })}
                  data={[
                    { value: 'auto', label: 'Auto' },
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                  ]}
                />
              </SettingRow>
              <ColorRow
                label="Labels"
                hint="Empty matches the text colour."
                value={theme.labelColor}
                onChange={(value) => onChange({ labelColor: value })}
              />
            </SettingsGroup>

            <SettingsGroup title="Fields">
              <ColorRow label="Background" value={theme.inputBg} onChange={(value) => onChange({ inputBg: value })} />
              <ColorRow
                label="Border"
                value={theme.inputBorder}
                onChange={(value) => onChange({ inputBorder: value })}
              />
              <ColorRow
                label="Typed text"
                hint="Empty matches the text colour."
                value={theme.inputTextColor}
                onChange={(value) => onChange({ inputTextColor: value })}
              />
            </SettingsGroup>
          </SettingsStack>
        </Tabs.Panel>

        <Tabs.Panel value="background">
          <SettingsStack>
            {scope === 'page' ? (
              <SettingsGroup title="Page background" hint="Painted behind the form card.">
                <SettingRow stacked>
                  <BackgroundEditor layer={theme.pageBackground ?? {}} onChange={patchLayer('pageBackground')} allowFixed />
                </SettingRow>
              </SettingsGroup>
            ) : (
              <Text size="xs" c="dimmed">
                Embedded forms have no page of their own. Your site's background shows behind the card.
              </Text>
            )}
            <SettingsGroup title="Card background" hint="Painted behind the questions.">
              <SettingRow stacked>
                <BackgroundEditor layer={theme.cardBackground ?? {}} onChange={patchLayer('cardBackground')} />
              </SettingRow>
            </SettingsGroup>
          </SettingsStack>
        </Tabs.Panel>

        <Tabs.Panel value="style">
          <SettingsStack>
            <SettingsGroup title="Typography">
              <SettingRow label="Font">
                <Select
                  size="xs"
                  w={180}
                  value={theme.fontFamily ?? 'system'}
                  onChange={(value) => onChange({ fontFamily: (value ?? 'system') as FontFamilyId })}
                  data={FONT_OPTIONS}
                  allowDeselect={false}
                  aria-label="Font"
                />
              </SettingRow>
            </SettingsGroup>

            <SettingsGroup title="Card">
              <SettingRow label="Shadow">
                <SegmentedControl
                  size="xs"
                  value={theme.cardShadow ?? 'none'}
                  onChange={(value) => onChange({ cardShadow: value as FormTheme['cardShadow'] })}
                  data={[
                    { value: 'none', label: 'None' },
                    { value: 'sm', label: 'S' },
                    { value: 'md', label: 'M' },
                    { value: 'lg', label: 'L' },
                    { value: 'xl', label: 'XL' },
                  ]}
                />
              </SettingRow>
              <SliderRow
                label="Corner radius"
                value={theme.cardRadius ?? 8}
                unit="px"
                min={0}
                max={48}
                step={1}
                onChange={(value) => onChange({ cardRadius: value })}
              />
              <SliderRow
                label="Opacity"
                hint="Below 100% the page background shows through."
                value={theme.cardOpacity ?? 100}
                unit="%"
                min={20}
                max={100}
                step={5}
                onChange={(value) => onChange({ cardOpacity: value })}
              />
              <SliderRow
                label="Glass blur"
                hint="Blurs what's behind a see-through card. No effect at 100% opacity."
                value={theme.cardBlur ?? 0}
                unit="px"
                min={0}
                max={40}
                step={1}
                onChange={(value) => onChange({ cardBlur: value })}
              />
            </SettingsGroup>
          </SettingsStack>
        </Tabs.Panel>
      </Tabs>
    </SettingsDrawer>
  );
}

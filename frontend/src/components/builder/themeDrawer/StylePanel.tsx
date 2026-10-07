import { SegmentedControl, Select } from '@mantine/core';
import type { FontFamilyId, FormTheme } from '@/types';
import { FONT_OPTIONS } from '@/lib/formFonts';
import { SettingsGroup, SettingRow, SettingsStack } from '../settings/SettingsGroup';
import { SliderRow } from '../settings/SliderRow';
import { FieldStyleTiles } from './FieldStyleTiles';

interface Props {
  theme: FormTheme;
  onChange: (patch: Partial<FormTheme>) => void;
}

const FONT_GROUPS = (['Sans', 'Serif', 'Other'] as const).map((group) => ({
  group,
  items: FONT_OPTIONS.filter((option) => option.group === group).map(({ value, label }) => ({ value, label })),
}));

function Segmented<T extends string>({
  value,
  onChange,
  data,
}: {
  value: T;
  onChange: (value: T) => void;
  data: { value: T; label: string }[];
}) {
  return <SegmentedControl size="xs" value={value} onChange={(v) => onChange(v as T)} data={data} />;
}

export function StylePanel({ theme, onChange }: Props) {
  const flat = theme.surface === 'flat';

  return (
    <SettingsStack>
      <SettingsGroup title="Layout">
        <SettingRow label="Surface" hint="Flat drops the card for a clean, open page.">
          <Segmented
            value={theme.surface ?? 'card'}
            onChange={(value) => onChange({ surface: value })}
            data={[
              { value: 'card', label: 'Card' },
              { value: 'flat', label: 'Flat' },
            ]}
          />
        </SettingRow>
        <SettingRow label="Width">
          <Segmented
            value={theme.cardWidth ?? 'regular'}
            onChange={(value) => onChange({ cardWidth: value })}
            data={[
              { value: 'narrow', label: 'Narrow' },
              { value: 'regular', label: 'Regular' },
              { value: 'wide', label: 'Wide' },
            ]}
          />
        </SettingRow>
        <SettingRow label="Spacing">
          <Segmented
            value={theme.density ?? 'comfortable'}
            onChange={(value) => onChange({ density: value })}
            data={[
              { value: 'compact', label: 'Compact' },
              { value: 'comfortable', label: 'Default' },
              { value: 'spacious', label: 'Airy' },
            ]}
          />
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Typography">
        <SettingRow label="Font">
          <Select
            size="xs"
            w={180}
            value={theme.fontFamily ?? 'system'}
            onChange={(value) => onChange({ fontFamily: (value ?? 'system') as FontFamilyId })}
            data={FONT_GROUPS}
            allowDeselect={false}
            aria-label="Font"
          />
        </SettingRow>
        <SettingRow label="Title size">
          <Segmented
            value={theme.titleSize ?? 'sm'}
            onChange={(value) => onChange({ titleSize: value })}
            data={[
              { value: 'sm', label: 'S' },
              { value: 'md', label: 'M' },
              { value: 'lg', label: 'L' },
              { value: 'xl', label: 'XL' },
            ]}
          />
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Fields">
        <SettingRow stacked>
          <FieldStyleTiles value={theme.fieldStyle ?? 'outline'} onChange={(value) => onChange({ fieldStyle: value })} />
        </SettingRow>
        <SliderRow
          label="Corner radius"
          value={theme.fieldRadius ?? 8}
          unit="px"
          min={0}
          max={24}
          step={1}
          onChange={(value) => onChange({ fieldRadius: value })}
        />
      </SettingsGroup>

      <SettingsGroup title="Button">
        <SettingRow label="Style">
          <Segmented
            value={theme.buttonStyle ?? 'solid'}
            onChange={(value) => onChange({ buttonStyle: value })}
            data={[
              { value: 'solid', label: 'Solid' },
              { value: 'soft', label: 'Soft' },
              { value: 'outline', label: 'Outline' },
            ]}
          />
        </SettingRow>
        <SettingRow label="Shape">
          <Segmented
            value={theme.buttonShape ?? 'match'}
            onChange={(value) => onChange({ buttonShape: value })}
            data={[
              { value: 'match', label: 'Match fields' },
              { value: 'pill', label: 'Pill' },
            ]}
          />
        </SettingRow>
      </SettingsGroup>

      {!flat && (
        <SettingsGroup title="Card">
          <SettingRow label="Shadow">
            <Segmented
              value={theme.cardShadow ?? 'none'}
              onChange={(value) => onChange({ cardShadow: value })}
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
      )}
    </SettingsStack>
  );
}

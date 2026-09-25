import type { CSSProperties } from 'react';
import { ColorInput, Tooltip } from '@mantine/core';
import { SettingRow } from './SettingsGroup';
import classes from './settings.module.css';

export const COLOR_SWATCHES = [
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

export function ColorRow({
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string | undefined;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <SettingRow label={label} hint={hint}>
      <ColorInput
        className={classes.colorControl}
        size="xs"
        value={value ?? ''}
        placeholder={placeholder ?? 'Default'}
        onChange={onChange}
        swatches={COLOR_SWATCHES}
        aria-label={label}
      />
    </SettingRow>
  );
}

export function SwatchPicker({
  value,
  options,
  onChange,
}: {
  value: string | undefined;
  options: { color: string; name: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className={classes.swatches}>
      {options.map((option) => (
        <Tooltip key={option.color} label={option.name} withArrow>
          <button
            type="button"
            className={classes.swatch}
            data-active={value?.toLowerCase() === option.color.toLowerCase() || undefined}
            style={{ '--swatch': option.color } as CSSProperties}
            onClick={() => onChange(option.color)}
            aria-label={option.name}
          />
        </Tooltip>
      ))}
    </div>
  );
}

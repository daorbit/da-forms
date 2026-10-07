import { Slider } from '@mantine/core';
import { SettingRow } from './SettingsGroup';

interface Props {
  label: string;
  hint?: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export function SliderRow({ label, hint, value, unit, min, max, step, onChange }: Props) {
  return (
    <SettingRow stacked label={`${label} · ${value}${unit}`} hint={hint}>
      <Slider value={value} onChange={onChange} min={min} max={max} step={step} color="emerald" label={null} />
    </SettingRow>
  );
}

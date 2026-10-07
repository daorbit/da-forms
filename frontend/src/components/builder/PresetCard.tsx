import { Text } from '@mantine/core';
import { CheckIcon } from 'lucide-react';
import type { ThemePreset } from '@/lib/themes';
import classes from './PresetCard.module.css';

interface Props {
  preset: ThemePreset;
  selected: boolean;
  onSelect: () => void;
}

function swatchBackground(theme: ThemePreset['theme']): string | undefined {
  const gradient = theme.pageBackground?.gradient;
  if (gradient && theme.pageBg) return `${gradient}, ${theme.pageBg}`;
  return gradient ?? theme.pageBg;
}

export function PresetCard({ preset, selected, onSelect }: Props) {
  const t = preset.theme;
  const flat = t.surface === 'flat';

  return (
    <button
      type="button"
      className={classes.card}
      onClick={onSelect}
      aria-pressed={selected}
      data-selected={selected}
    >
      <span className={classes.swatch} style={{ background: swatchBackground(t) }}>
        <span
          className={classes.miniCard}
          data-flat={flat || undefined}
          data-field-style={t.fieldStyle}
          style={{ backgroundColor: flat ? 'transparent' : t.cardBg, borderColor: flat ? 'transparent' : t.cardBorder }}
        >
          <span className={classes.line} style={{ backgroundColor: t.labelColor }} />
          <span className={classes.input} style={{ backgroundColor: t.inputBg, borderColor: t.inputBorder }} />
          <span className={classes.input} style={{ backgroundColor: t.inputBg, borderColor: t.inputBorder }} />
          <span
            className={classes.accent}
            data-pill={t.buttonShape === 'pill' || undefined}
            style={{ backgroundColor: t.accentColor }}
          />
        </span>
        {selected && (
          <span className={classes.check}>
            <CheckIcon size={12} strokeWidth={3} />
          </span>
        )}
      </span>
      <Text size="xs" fw={selected ? 600 : 500} mt={7} lineClamp={1} className={classes.label}>
        {preset.name}
      </Text>
    </button>
  );
}

import { Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import type { ThemePreset } from '@/lib/themePresets';
import classes from './PresetCard.module.css';

interface Props {
  preset: ThemePreset;
  selected: boolean;
  onSelect: () => void;
}

/** Shows the preset's actual palette rather than a mock screenshot, so it never drifts from the theme. */
export function PresetCard({ preset, selected, onSelect }: Props) {
  const t = preset.theme;

  return (
    <button
      type="button"
      className={classes.card}
      onClick={onSelect}
      aria-pressed={selected}
      data-selected={selected}
    >
      <span className={classes.swatch} style={{ backgroundColor: t.pageBg }}>
        <span
          className={classes.card2}
          style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}
        >
          <span className={classes.accent} style={{ backgroundColor: t.accentColor }} />
        </span>
        {selected && (
          <span className={classes.check}>
            <IconCheck size={12} stroke={3} />
          </span>
        )}
      </span>
      <Text size="xs" fw={selected ? 600 : 400} mt={6} lineClamp={1}>
        {preset.name}
      </Text>
    </button>
  );
}

import { Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import type { ThemePreset } from '@/lib/themes';
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
      <span
        className={classes.swatch}
        style={{ background: t.pageBackground?.gradient ?? t.pageBg }}
      >
        <span className={classes.miniCard} style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
          <span className={classes.line} style={{ backgroundColor: t.labelColor }} />
          <span
            className={classes.input}
            style={{ backgroundColor: t.inputBg, borderColor: t.inputBorder }}
          />
          <span className={classes.accent} style={{ backgroundColor: t.accentColor }} />
        </span>
        {selected && (
          <span className={classes.check}>
            <IconCheck size={12} stroke={3} />
          </span>
        )}
      </span>
      <Text size="xs" fw={selected ? 600 : 500} mt={7} lineClamp={1} className={classes.label}>
        {preset.name}
      </Text>
    </button>
  );
}

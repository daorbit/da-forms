import { Box, Text } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { THEME_PRESETS } from '@/lib/themePresets';
import { PresetCard } from './PresetCard';
import classes from './PreviewModal.module.css';

interface Props {
  open: boolean;
  onToggle: () => void;
  /** The preset whose card is highlighted — the one being tried, or the theme's own. */
  selectedId?: string;
  onSelect: (id: string) => void;
}

/** The collapsible strip of theme presets alongside the preview stage. */
export function PreviewThemePanel({ open, onToggle, selectedId, onSelect }: Props) {
  return (
    <>
      <button
        type="button"
        className={classes.panelToggle}
        onClick={onToggle}
        aria-label={open ? 'Hide themes' : 'Show themes'}
        data-open={open}
      >
        {open ? <IconChevronRight size={15} /> : <IconChevronLeft size={15} />}
      </button>

      {open && (
        <Box className={classes.panel}>
          <Text size="xs" fw={600} tt="uppercase" mb={10} className={classes.panelHeading}>
            Themes
          </Text>
          <Box className={classes.presetGrid}>
            {THEME_PRESETS.map((item) => (
              <PresetCard
                key={item.id}
                preset={item}
                selected={item.id === selectedId}
                onSelect={() => onSelect(item.id)}
              />
            ))}
          </Box>
        </Box>
      )}
    </>
  );
}

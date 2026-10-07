import type { FormTheme } from '@/types';
import { THEME_PRESETS, matchesPreset, presetPatch } from '@/lib/themes';
import { studioPresets } from '@/lib/themes/studio';
import { SettingsGroup, SettingsStack } from '../settings/SettingsGroup';
import { PresetCard } from '../PresetCard';
import classes from './ThemeDrawer.module.css';

interface Props {
  theme: FormTheme;
  onChange: (patch: Partial<FormTheme>) => void;
}

const STUDIO_IDS = new Set(studioPresets.map((p) => p.id));
const MORE = THEME_PRESETS.filter((p) => !STUDIO_IDS.has(p.id));

export function LooksPanel({ theme, onChange }: Props) {
  const renderGrid = (presets: typeof THEME_PRESETS) => (
    <div className={classes.lookGrid}>
      {presets.map((preset) => (
        <PresetCard
          key={preset.id}
          preset={preset}
          selected={matchesPreset(theme, preset)}
          onSelect={() => onChange(presetPatch(preset))}
        />
      ))}
    </div>
  );

  return (
    <SettingsStack>
      <SettingsGroup title="Studio" hint="Complete looks: colours, type, fields and spacing in one click.">
        {renderGrid(studioPresets)}
      </SettingsGroup>
      <SettingsGroup title="More looks">{renderGrid(MORE)}</SettingsGroup>
    </SettingsStack>
  );
}

import { THEME_PRESETS } from '@/lib/themes';
import { StudioPanel } from '@/components/studio/StudioPanel';
import { PresetCard } from './PresetCard';
import classes from './PreviewModal.module.css';

interface Props {
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function PreviewThemePanel({ selectedId, onSelect }: Props) {
  return (
    <StudioPanel title="Themes" subtitle="Try a look on the preview, then apply it to the form.">
      <div className={classes.presetGrid}>
        {THEME_PRESETS.map((item) => (
          <PresetCard
            key={item.id}
            preset={item}
            selected={item.id === selectedId}
            onSelect={() => onSelect(item.id)}
          />
        ))}
      </div>
    </StudioPanel>
  );
}

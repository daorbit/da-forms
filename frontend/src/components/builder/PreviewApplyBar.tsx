import { Button } from '@mantine/core';
import type { ThemePreset } from '@/lib/themes';
import classes from './PreviewModal.module.css';

interface Props {
  preset: ThemePreset;
  onReset: () => void;
  onApply: () => void;
}

export function PreviewApplyBar({ preset, onReset, onApply }: Props) {
  return (
    <div className={classes.applyBar} role="status">
      <span className={classes.applySwatch} style={{ background: preset.theme.accentColor }} aria-hidden />
      <span className={classes.applyText}>
        Previewing <strong>{preset.name}</strong>
      </span>
      <Button variant="subtle" size="xs" radius="xl" className={classes.applyReset} onClick={onReset}>
        Reset
      </Button>
      <Button size="xs" radius="xl" onClick={onApply}>
        Apply theme
      </Button>
    </div>
  );
}

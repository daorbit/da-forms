import type { FieldStyle } from '@/types';
import classes from './ThemeDrawer.module.css';

const STYLES: { value: FieldStyle; label: string }[] = [
  { value: 'outline', label: 'Outline' },
  { value: 'filled', label: 'Filled' },
  { value: 'underline', label: 'Underline' },
];

interface Props {
  value: FieldStyle;
  onChange: (value: FieldStyle) => void;
}

export function FieldStyleTiles({ value, onChange }: Props) {
  return (
    <div className={classes.tiles} role="radiogroup" aria-label="Field style">
      {STYLES.map((style) => {
        const active = style.value === value;
        return (
          <button
            key={style.value}
            type="button"
            role="radio"
            aria-checked={active}
            data-active={active || undefined}
            className={classes.tile}
            onClick={() => onChange(style.value)}
          >
            <span className={classes.tileArt} data-style={style.value}>
              <span className={classes.tileLabel} />
              <span className={classes.tileInput} />
            </span>
            <span className={classes.tileName}>{style.label}</span>
          </button>
        );
      })}
    </div>
  );
}

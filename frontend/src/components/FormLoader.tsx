import type { FormTheme } from '@/types';
import classes from './FormLoader.module.css';

interface Props {
  theme?: FormTheme;
  label?: string;
}

 
export function FormLoader({ theme, label = 'Loading form' }: Props) {
  const accent = theme?.accentColor ?? '#5b5bd6';

  return (
    <div
      className={classes.wrap}
      role="status"
      aria-live="polite"
      style={
        {
          '--da-loader-accent': accent,
          '--da-loader-label': theme?.labelColor ?? 'rgba(0, 0, 0, 0.55)',
        } as React.CSSProperties
      }
    >
      <div className={classes.mark}>
        <span className={classes.ring} />
        <span className={classes.ringInner} />
        <span className={classes.dot} />
      </div>
      <span className={classes.label}>{label}</span>
    </div>
  );
}

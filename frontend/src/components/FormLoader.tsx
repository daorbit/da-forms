import classes from './FormLoader.module.css';

interface Props {
  brand?: string;
  label?: string;
}

export function FormLoader({ brand = 'Quantalog', label }: Props) {
  return (
    <div className={classes.wrap} role="status" aria-live="polite" aria-label={label ?? 'Loading form'}>
      <div className={classes.mark} aria-hidden>
        <div className={classes.wordmark}>
          <span className={classes.word}>{brand}</span>
          <span className={classes.dot} />
        </div>
        <div className={classes.rule}>
          <span />
        </div>
      </div>
      {label && <p className={classes.label}>{label}</p>}
    </div>
  );
}

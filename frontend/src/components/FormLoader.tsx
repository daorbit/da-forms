import classes from './FormLoader.module.css';

export function FormLoader({ label = 'Loading form' }: { label?: string }) {
  return (
    <div className={classes.wrap} role="status" aria-live="polite" aria-label={label}>
      <span className={classes.dot} aria-hidden />
      <div className={classes.rule} aria-hidden>
        <span />
      </div>
    </div>
  );
}

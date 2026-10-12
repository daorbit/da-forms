import classes from './FormLoader.module.css';

interface Props {
  label?: string;
  fullPage?: boolean;
}

export function FormLoader({ label = 'Loading form', fullPage = false }: Props) {
  const loader = (
    <div className={classes.wrap} role="status" aria-live="polite" aria-label={label}>
      <svg className={classes.spinner} viewBox="0 0 50 50" aria-hidden>
        <circle className={classes.track} cx="25" cy="25" r="20" />
        <circle className={classes.arc} cx="25" cy="25" r="20" />
      </svg>
      <span className={classes.label}>{label}</span>
    </div>
  );

  return fullPage ? <div className={classes.page}>{loader}</div> : loader;
}

import classes from './ui.module.css';

export function StatusText({ live, label }: { live: boolean; label: string }) {
  return (
    <span className={classes.status} data-live={live || undefined}>
      {label}
    </span>
  );
}

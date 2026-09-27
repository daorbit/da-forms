import classes from './ui.module.css';

/**
 * A tinted pill with a matching dot — one colour drives the text, fill and
 * border, so the state reads at a glance without shouting.
 */
export function StatusPill({ tone, label }: { tone: 'live' | 'idle' | 'warn'; label: string }) {
  return (
    <span className={classes.pill} data-tone={tone}>
      <span className={classes.dot} />
      {label}
    </span>
  );
}

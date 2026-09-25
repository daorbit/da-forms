import classes from './ui.module.css';

/**
 * A neutral pill with a coloured dot — the colour says the state, the pill
 * stays quiet. `live` pulses softly.
 */
export function StatusPill({ tone, label }: { tone: 'live' | 'idle' | 'warn'; label: string }) {
  return (
    <span className={classes.pill} data-tone={tone}>
      <span className={classes.dot} />
      {label}
    </span>
  );
}

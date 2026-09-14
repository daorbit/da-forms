import classes from './aurora.module.css';

interface Props {
  /** Swells and brightens the wash while a form is being generated. */
  building?: boolean;
}

/**
 * The background for the whole create flow.
 *
 * Purely decorative and fixed behind everything, so it is hidden from the
 * accessibility tree outright — there is nothing here to describe.
 */
export function Aurora({ building = false }: Props) {
  return (
    <div
      className={`${classes.aurora} ${building ? classes.building : ''}`}
      aria-hidden="true"
    >
      <span className={`${classes.blob} ${classes.blob1}`} />
      <span className={`${classes.blob} ${classes.blob2}`} />
      <span className={`${classes.blob} ${classes.blob3}`} />
    </div>
  );
}

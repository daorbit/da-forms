import classes from './aurora.module.css';

interface Props {
  /** Lifts the wash while a form is being generated. */
  building?: boolean;
}

/**
 * The background for the whole create flow.
 *
 * A single element: the wash is three radial gradients on its own background,
 * and the dither over them is a pseudo-element, so there is nothing here to
 * render per layer. Purely decorative and fixed behind everything, so it is
 * hidden from the accessibility tree outright.
 */
export function Aurora({ building = false }: Props) {
  return (
    <div
      className={`${classes.aurora} ${building ? classes.building : ''}`}
      aria-hidden="true"
    />
  );
}

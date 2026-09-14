import { useEffect, useState } from 'react';
import { Text } from '@mantine/core';
import classes from './createForm.module.css';

/**
 * What Orbit is doing, in the order it does it.
 *
 * Honest about the shape of the work without pretending to report on it: the
 * model answers in one call, so these are the stages of that call rather than
 * events being observed. They advance on a timer and the last one holds until
 * the reply actually lands.
 */
const STAGES = [
  'Reading your description',
  'Choosing the fields',
  'Writing the labels',
  'Picking a theme',
  'Laying it out',
];

/** How long each stage holds before the next takes over. */
const STAGE_MS = 1500;

/**
 * The wireframe's rows.
 *
 * Two half-width rows first, the way a name field splits, then full-width ones
 * and a taller box for a message. A stack of identical bars reads as a spinner
 * stretched out; uneven ones read as a form.
 */
const ROWS: { half?: boolean; tall?: boolean }[] = [
  { half: true },
  { half: true },
  {},
  {},
  { tall: true },
];

interface Props {
  /** The ask being answered, shown back so it stays readable through the wait. */
  prompt: string;
  /** True once the reply has landed. */
  done: boolean;
}

/**
 * The wait, as a wireframe of what is coming.
 *
 * Everything is on screen from the first frame and nothing moves except a slow
 * shimmer across the bars — the shape of the form is the message, and anything
 * that assembles, spins or travels was noise on top of it.
 */
export function DraftingStage({ prompt, done }: Props) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (done) return;
    // Stops one short of the end: the final stage holds until the reply lands
    // rather than completing and leaving the line looking finished while the
    // request is still out.
    const id = window.setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, STAGE_MS);
    return () => clearInterval(id);
  }, [done]);

  return (
    <div className={classes.drafting}>
      {/* Decorative: it is a picture of the form, and the line below says what
          is actually happening. */}
      <div className={classes.wire} aria-hidden="true">
        <div className={classes.wireHead}>
          <span className={`${classes.wireBar} ${classes.wireTitle}`} />
          <span className={`${classes.wireBar} ${classes.wireSub}`} />
        </div>

        <div className={classes.wireRows}>
          {ROWS.map((row, i) => (
            <div
              key={i}
              className={`${classes.wireRow} ${row.half ? classes.wireRowHalf : ''}`}
            >
              <span className={`${classes.wireBar} ${classes.wireLabel}`} />
              <span
                className={`${classes.wireBar} ${classes.wireInput} ${
                  row.tall ? classes.wireInputTall : ''
                }`}
              />
            </div>
          ))}
        </div>

        <span className={`${classes.wireBar} ${classes.wireButton}`} />
      </div>

      <div className={classes.wireStatus}>
        {/* One live region, so a screen reader hears each stage as it becomes
            current rather than all of them at once. */}
        <Text size="sm" fw={500} aria-live="polite">
          {done ? 'Opening your form' : STAGES[stage]}
        </Text>
        <Text size="xs" c="dimmed" className={classes.wirePrompt}>
          {prompt}
        </Text>
      </div>
    </div>
  );
}

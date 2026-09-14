import { useEffect, useState } from 'react';
import { Text } from '@mantine/core';
import { OrbitMark } from '@/components/OrbitMark';
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
 * The shape of the placeholder form.
 *
 * Uneven on purpose, and paired where a real form would pair them — a stack of
 * identical full-width bars reads as a loading spinner stretched out, where
 * varied ones read as a form with different kinds of question in it.
 */
const GHOST_ROWS: { half?: boolean; tall?: boolean }[] = [
  { half: true },
  { half: true },
  {},
  { tall: true },
  {},
  {},
];

interface Props {
  /** The ask being answered, shown back so it stays readable through the wait. */
  prompt: string;
  /** True once the reply has landed and every stage should read as finished. */
  done: boolean;
}

/**
 * The wait, on the hero.
 *
 * Between pressing Send and the workspace opening there is a real pause, and
 * cutting straight to an empty two-pane layout spends it showing nothing. This
 * holds the screen with a card filling in — rows arriving one at a time, in
 * roughly the rhythm the real form will — so the pause looks like the form
 * being written rather than like nothing happening.
 */
export function DraftingStage({ prompt, done }: Props) {
  const [stage, setStage] = useState(0);
  const [rows, setRows] = useState(1);

  useEffect(() => {
    if (done) return;
    // Stops one short of the end: the final stage holds until the reply lands
    // rather than completing and leaving the list looking finished while the
    // request is still out.
    const id = window.setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, STAGE_MS);
    return () => clearInterval(id);
  }, [done]);

  /**
   * Rows arrive faster than stages, and loop.
   *
   * Looping rather than filling once and stopping: the request can take longer
   * than the rows do, and a card that finished filling and then sat still would
   * be the same dead screen this exists to replace.
   */
  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      setRows((r) => (r >= GHOST_ROWS.length ? 1 : r + 1));
    }, 520);
    return () => clearInterval(id);
  }, [done]);

  return (
    <div className={classes.drafting}>
      {/* The card being written. Decorative — the line below reports what is
          actually happening. */}
      <div className={classes.draftCard} aria-hidden="true">
        <div className={classes.draftCardHead}>
          <span className={`${classes.ghostBar} ${classes.draftTitle}`} />
          <span className={`${classes.ghostBar} ${classes.draftSub}`} />
        </div>

        <div className={classes.draftRows}>
          {GHOST_ROWS.map((row, i) => (
            <div
              key={i}
              className={`${classes.draftRow} ${
                row.half ? classes.draftRowHalf : classes.draftRowFull
              }`}
              style={{
                // Rows past the current count keep their space but stay
                // invisible, so the card does not resize as it fills.
                visibility: i < rows ? 'visible' : 'hidden',
              }}
            >
              <span className={`${classes.ghostBar} ${classes.draftLabel}`} />
              <span
                className={`${classes.ghostBar} ${classes.draftInput} ${
                  row.tall ? classes.draftInputTall : ''
                }`}
              />
            </div>
          ))}
        </div>

        <span className={`${classes.ghostBar} ${classes.draftButton}`} />
      </div>

      <div className={classes.draftingStatus}>
        <span className={classes.draftingMark}>
          <OrbitMark size={22} />
        </span>

        {/* One live region, so a screen reader hears each stage as it becomes
            current rather than all of them at once. */}
        <Text size="sm" fw={500} aria-live="polite" className={classes.stageLabel} key={stage}>
          {done ? 'Opening your form' : STAGES[stage]}
        </Text>

        <span className={classes.stageDots} aria-hidden>
          {STAGES.map((label, i) => (
            <span
              key={label}
              className={`${classes.stageDot} ${
                done || i < stage ? classes.stageDotDone : ''
              } ${!done && i === stage ? classes.stageDotCurrent : ''}`}
            />
          ))}
        </span>
      </div>

      <Text size="xs" c="dimmed" ta="center" className={classes.draftingPrompt}>
        “{prompt}”
      </Text>
    </div>
  );
}

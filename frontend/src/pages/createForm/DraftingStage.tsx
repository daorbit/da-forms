import { useEffect, useState } from 'react';
import { Text } from '@mantine/core';
import type { Draft } from './types';
import classes from './createForm.module.css';

const STEPS = [
  'Understanding your description',
  'Choosing the fields',
  'Writing the labels',
  'Picking a theme',
];

const STEP_MS = 1300;

interface Props {
  prompt: string;
  draft: Draft | null;
}

export function DraftingStage({ prompt, draft }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (draft) return;
    const id = window.setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, STEP_MS);
    return () => clearInterval(id);
  }, [draft]);

  const progress = draft ? 1 : (step + 1) / (STEPS.length + 1);

  return (
    <div className={classes.drafting}>
      <div className={classes.orb}>
        <span className={classes.orbRing} />
        <span className={classes.orbRingInner} />
        <span className={classes.orbCore} />
      </div>

      <div className={classes.draftingText}>
        <Text size="lg" fw={650} className={classes.draftingStep} key={draft ? 'done' : step}>
          {draft ? 'Your form is ready' : STEPS[step]}
        </Text>
        <Text size="sm" c="dimmed" mt={6}>
          {prompt}
        </Text>
      </div>

      <div className={classes.draftingMeter}>
        <span
          className={classes.draftingMeterFill}
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
    </div>
  );
}

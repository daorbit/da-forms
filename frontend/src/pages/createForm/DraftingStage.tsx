import { useEffect, useState } from 'react';
import { Text } from '@mantine/core';
import { OrbitMark } from '../../components/OrbitMark';
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
        <div className={classes.orbSweep} />
        <svg viewBox="0 0 96 96" className={classes.orbDoc} aria-hidden="true">
          <rect x="16" y="10" width="64" height="76" rx="8" className={classes.orbDocOutline} />
          <line x1="28" y1="30" x2="68" y2="30" className={classes.orbDocLine} />
          <line x1="28" y1="44" x2="68" y2="44" className={classes.orbDocLine} />
          <line x1="28" y1="58" x2="58" y2="58" className={classes.orbDocLine} />
          <line x1="28" y1="72" x2="52" y2="72" className={classes.orbDocLine} />
        </svg>
        <span className={classes.orbBadge}>
          <OrbitMark size={12} />
          Orbit AI
        </span>
      </div>

      <div className={classes.draftingText}>
        <Text size="lg" fw={650} className={classes.draftingStep} key={draft ? 'done' : step}>
          {draft ? 'Your form is ready' : STEPS[step]}
        </Text>
        <Text size="sm" c="dimmed" mt={6}>
          {draft ? prompt : `Orbit AI is drafting this from: "${prompt}"`}
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

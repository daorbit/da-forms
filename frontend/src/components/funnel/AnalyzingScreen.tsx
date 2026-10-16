import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Text } from '@mantine/core';
import { CheckIcon } from 'lucide-react';
import type { FormField } from '@/types';
import classes from './AnalyzingScreen.module.css';

const DEFAULT_SECONDS = 5;
const TICK_MS = 50;

interface Props {
  field: FormField;
  accentColor?: string;
  textColor?: string;
  onComplete?: () => void;
}

export function stepsOf(field: FormField): string[] {
  return (field.content ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function AnalyzingScreen({ field, accentColor, textColor, onComplete }: Props) {
  const steps = useMemo(() => stepsOf(field), [field]);
  const totalMs = Math.max(1, field.duration ?? DEFAULT_SECONDS) * 1000;
  const [elapsed, setElapsed] = useState(0);
  const done = useRef(false);
  const complete = useRef(onComplete);
  complete.current = onComplete;

  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      const ms = Math.min(totalMs, Date.now() - started);
      setElapsed(ms);
      if (ms >= totalMs && !done.current) {
        done.current = true;
        window.clearInterval(timer);
        window.setTimeout(() => complete.current?.(), 400);
      }
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [totalMs]);

  const progress = elapsed / totalMs;
  const percent = Math.round(progress * 100);
  const reached = Math.floor(progress * steps.length);
  const vars = { ...(accentColor ? { '--loader-accent': accentColor } : {}), '--loader-progress': progress } as CSSProperties;

  return (
    <div className={classes.root} style={vars} role="status" aria-live="polite">
      <div className={classes.ring}>
        <svg viewBox="0 0 120 120" className={classes.ringSvg} aria-hidden>
          <circle cx="60" cy="60" r="52" className={classes.ringTrack} />
          <circle cx="60" cy="60" r="52" pathLength={100} className={classes.ringValue} />
        </svg>
        <span className={classes.percent}>{percent}%</span>
      </div>
      <Text fw={650} size="lg" ta="center" c={textColor}>
        {field.label || 'Analyzing your answers…'}
      </Text>
      <div className={classes.bar}>
        <span className={classes.fill} />
      </div>
      {steps.length > 0 && (
        <ul className={classes.steps}>
          {steps.map((step, index) => (
            <li key={step} className={classes.step} data-state={index < reached ? 'done' : index === reached ? 'active' : 'waiting'}>
              <span className={classes.stepMark}>{index < reached && <CheckIcon size={12} strokeWidth={3} />}</span>
              {step}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

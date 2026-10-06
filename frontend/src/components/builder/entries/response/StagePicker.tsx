import type { SubmissionStage } from '@/types';
import { STAGES } from '@/lib/stages';
import classes from './StagePicker.module.css';

interface Props {
  value: SubmissionStage;
  onChange: (stage: SubmissionStage) => void;
  disabled?: boolean;
}

export function StagePicker({ value, onChange, disabled }: Props) {
  return (
    <div className={classes.track} role="radiogroup" aria-label="Stage">
      {STAGES.map((stage) => {
        const active = stage.id === value;
        return (
          <button
            key={stage.id}
            type="button"
            role="radio"
            aria-checked={active}
            className={classes.stage}
            data-stage={stage.id}
            data-active={active || undefined}
            disabled={disabled}
            onClick={() => !active && onChange(stage.id)}
          >
            <span className={classes.dot} />
            <span className={classes.label}>{stage.label}</span>
          </button>
        );
      })}
    </div>
  );
}

import { UnstyledButton } from '@mantine/core';
import classes from './settings.module.css';

export interface Choice<T extends string> {
  value: T;
  label: string;
  hint: string;
}

export function ChoiceCards<T extends string>({
  value,
  onChange,
  choices,
  ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  choices: Choice<T>[];
  ariaLabel: string;
}) {
  return (
    <div className={classes.choiceGrid} role="radiogroup" aria-label={ariaLabel}>
      {choices.map((choice) => {
        const active = choice.value === value;
        return (
          <UnstyledButton
            key={choice.value}
            className={classes.choice}
            data-active={active || undefined}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(choice.value)}
          >
            <span className={classes.choiceHead}>
              {choice.label}
              <span className={classes.radio} aria-hidden />
            </span>
            <span className={classes.choiceHint}>{choice.hint}</span>
          </UnstyledButton>
        );
      })}
    </div>
  );
}

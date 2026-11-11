import { UnstyledButton } from '@mantine/core';
import classes from './EntriesCalendar.module.css';

export interface LegendForm {
  id: string;
  name: string;
  tone: number;
}

interface Props {
  forms: LegendForm[];
  activeId: string | null;
  onPick: (id: string | null) => void;
}

export function CalendarFormLegend({ forms, activeId, onPick }: Props) {
  if (forms.length < 2 && !activeId) return null;
  return (
    <div className={classes.legend} role="group" aria-label="Filter by form">
      {forms.map((form) => {
        const active = form.id === activeId;
        return (
          <UnstyledButton
            key={form.id}
            className={classes.legendItem}
            data-tone={form.tone}
            data-active={active || undefined}
            data-dimmed={(activeId !== null && !active) || undefined}
            aria-pressed={active}
            onClick={() => onPick(active ? null : form.id)}
          >
            <span className={classes.legendDot} />
            <span className={classes.legendName}>{form.name}</span>
          </UnstyledButton>
        );
      })}
    </div>
  );
}

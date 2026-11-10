import { UnstyledButton } from '@mantine/core';
import { formTone } from './bookingCalendarEvents';
import classes from './BookingsPage.module.css';

export function FormLegend({
  forms,
  counts,
  formId,
  onForm,
}: {
  forms: { id: string; title: string }[];
  counts: Map<string, number>;
  formId: string | null;
  onForm: (id: string | null) => void;
}) {
  if (forms.length < 2) return null;
  const ids = forms.map((f) => f.id);

  return (
    <div className={classes.legend} role="group" aria-label="Filter by form">
      {forms.map((f) => {
        const active = formId === f.id;
        return (
          <UnstyledButton
            key={f.id}
            className={classes.legendChip}
            data-tone={formTone(ids, f.id)}
            data-active={active || undefined}
            data-dim={(formId !== null && !active) || undefined}
            onClick={() => onForm(active ? null : f.id)}
            aria-pressed={active}
          >
            <span className={classes.legendDot} />
            <span className={classes.legendName}>{f.title || 'Untitled form'}</span>
            <span className={classes.legendCount}>{counts.get(f.id) ?? 0}</span>
          </UnstyledButton>
        );
      })}
    </div>
  );
}

import type { ReactNode } from 'react';
import { Switch } from '@mantine/core';
import classes from './PropertySection.module.css';

interface Props {
  title: string;
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}

export function PropertySection({ title, description, aside, children }: Props) {
  return (
    <section className={classes.section}>
      <div className={classes.head}>
        <div>
          <div className={classes.title}>{title}</div>
          {description && <div className={classes.description}>{description}</div>}
        </div>
        {aside && <div className={classes.aside}>{aside}</div>}
      </div>
      <div className={classes.body}>{children}</div>
    </section>
  );
}

export function ToggleList({ children }: { children: ReactNode }) {
  return <div className={classes.toggles}>{children}</div>;
}

export function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={classes.toggle}>
      <span className={classes.toggleText}>
        <span className={classes.toggleLabel}>{label}</span>
        {hint && <span className={classes.toggleHint}>{hint}</span>}
      </span>
      <Switch checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} aria-label={label} />
    </label>
  );
}

export function FieldPair({ children }: { children: ReactNode }) {
  return <div className={classes.pair}>{children}</div>;
}

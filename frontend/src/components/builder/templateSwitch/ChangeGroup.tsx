import type { ReactNode } from 'react';
import type { FormField } from '@/types';
import { fieldLabel } from '@/lib/templateSwitch';
import classes from './templateSwitch.module.css';

const SHOWN = 6;

interface Props {
  tone: 'kept' | 'added' | 'removed';
  icon: ReactNode;
  title: string;
  fields: FormField[];
  children?: ReactNode;
}

export function ChangeGroup({ tone, icon, title, fields, children }: Props) {
  if (fields.length === 0) return null;
  const extra = fields.length - SHOWN;

  return (
    <section className={classes.group} data-tone={tone}>
      <header className={classes.groupHead}>
        <span className={classes.groupIcon}>{icon}</span>
        <span className={classes.groupTitle}>{title}</span>
        <span className={classes.groupCount}>{fields.length}</span>
      </header>
      <ul className={classes.groupList}>
        {fields.slice(0, SHOWN).map((field) => (
          <li key={field.id} className={classes.groupItem}>
            {fieldLabel(field)}
          </li>
        ))}
        {extra > 0 && <li className={classes.groupMore}>and {extra} more</li>}
      </ul>
      {children}
    </section>
  );
}

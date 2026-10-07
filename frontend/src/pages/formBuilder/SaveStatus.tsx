import { Loader } from '@mantine/core';
import { CheckIcon } from 'lucide-react';
import classes from '../FormBuilderPage.module.css';

interface Props {
  saving: boolean;
  isDirty: boolean;
  hasSaved: boolean;
}

export function SaveStatus({ saving, isDirty, hasSaved }: Props) {
  if (saving) {
    return (
      <span className={classes.saveStatus}>
        <Loader size={10} />
        Saving…
      </span>
    );
  }
  if (isDirty || !hasSaved) {
    return (
      <span className={classes.saveStatus} data-state="dirty">
        <span className={classes.saveDot} />
        {hasSaved ? 'Unsaved changes' : 'Not saved yet'}
      </span>
    );
  }
  return (
    <span className={classes.saveStatus} data-state="saved">
      <CheckIcon size={12} strokeWidth={2.6} />
      Saved
    </span>
  );
}

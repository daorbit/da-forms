import type { FormField, Submission } from '@/types';
import { respondentIdentity } from '@/lib/respondent';
import classes from './EntryRow.module.css';

interface Props {
  fields: FormField[];
  submission: Submission;
}

export function RespondentCell({ fields, submission }: Props) {
  const who = respondentIdentity(fields, submission);
  const primary = who.name ?? who.email ?? 'Anonymous';
  const secondary = who.name ? who.email : who.phone;

  return (
    <div className={classes.respondent}>
      <span className={classes.avatar} data-unread={!submission.read || undefined}>
        {who.initials}
      </span>
      <span className={classes.who}>
        <span className={classes.name}>{primary}</span>
        {secondary && <span className={classes.sub}>{secondary}</span>}
      </span>
    </div>
  );
}

import { Checkbox } from '@mantine/core';
import type { FormField, Submission } from '@/types';
import { relativeTime } from '@/lib/relativeTime';
import { RespondentCell } from './RespondentCell';
import { StageLabel } from './StageLabel';
import { SourceLabel } from './SourceLabel';
import { RowActions } from './RowActions';
import classes from './EntryListMobile.module.css';

interface Props {
  fields: FormField[];
  submissions: Submission[];
  loading: boolean;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onView: (submission: Submission) => void;
  onPdf: (submission: Submission) => void;
  onToggleRead?: (submission: Submission) => void;
  onDelete: (submission: Submission) => void;
}

export function EntryListMobile({
  fields,
  submissions,
  loading,
  selected,
  onToggleSelect,
  onView,
  onPdf,
  onToggleRead,
  onDelete,
}: Props) {
  return (
    <ul className={classes.list} data-loading={loading || undefined} aria-busy={loading}>
      {submissions.map((submission) => (
        <li
          key={submission._id}
          className={classes.item}
          data-selected={selected.has(submission._id) || undefined}
          onClick={() => onView(submission)}
        >
          <span className={classes.check} onClick={(e) => e.stopPropagation()}>
            <Checkbox
              size="xs"
              radius="sm"
              checked={selected.has(submission._id)}
              onChange={() => onToggleSelect(submission._id)}
              aria-label="Select response"
            />
          </span>
          <div className={classes.body}>
            <div className={classes.top}>
              <RespondentCell fields={fields} submission={submission} />
              <span className={classes.time}>{relativeTime(submission.createdAt)}</span>
            </div>
            <div className={classes.meta}>
              <StageLabel submission={submission} />
              <span className={classes.dot} aria-hidden />
              <span className={classes.source}>
                <SourceLabel submission={submission} />
              </span>
            </div>
          </div>
          <span className={classes.actions} onClick={(e) => e.stopPropagation()}>
            <RowActions
              submission={submission}
              onView={() => onView(submission)}
              onPdf={() => onPdf(submission)}
              onToggleRead={onToggleRead ? () => onToggleRead(submission) : undefined}
              onDelete={() => onDelete(submission)}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

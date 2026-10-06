import { ArchiveIcon } from 'lucide-react';
import type { Submission } from '@/types';
import { AnswerValue, copyableAnswer, hasAnswer, type Attachment } from './AnswerValue';
import { CopyAction } from './CopyAction';
import type { ResponseColumn } from './types';
import classes from './AnswerList.module.css';

interface Props {
  columns: ResponseColumn[];
  submission: Submission;
  onOpenAttachment: (attachment: Attachment) => void;
}

function AnswerRow({ field, submission, onOpenAttachment }: { field: ResponseColumn } & Omit<Props, 'columns'>) {
  const answered = hasAnswer(field, submission);
  const copyable = answered ? copyableAnswer(field, submission) : null;
  return (
    <div className={classes.row}>
      <div className={classes.head}>
        <span className={classes.label}>{field.label || 'Untitled question'}</span>
        {copyable && <CopyAction value={copyable} label="Copy answer" className={classes.copy} />}
      </div>
      {answered ? (
        <AnswerValue field={field} submission={submission} onOpenAttachment={onOpenAttachment} />
      ) : (
        <span className={classes.empty}>Not answered</span>
      )}
    </div>
  );
}

export function AnswerList({ columns, submission, onOpenAttachment }: Props) {
  const current = columns.filter((c) => !c.retired);
  const retired = columns.filter((c) => c.retired && hasAnswer(c, submission));

  return (
    <div className={classes.list}>
      {current.map((field) => (
        <AnswerRow key={field.id} field={field} submission={submission} onOpenAttachment={onOpenAttachment} />
      ))}

      {retired.length > 0 && (
        <div className={classes.group}>
          <span className={classes.groupTitle}>
            <ArchiveIcon size={12} />
            Removed from the form
          </span>
          {retired.map((field) => (
            <AnswerRow key={field.id} field={field} submission={submission} onOpenAttachment={onOpenAttachment} />
          ))}
        </div>
      )}
    </div>
  );
}

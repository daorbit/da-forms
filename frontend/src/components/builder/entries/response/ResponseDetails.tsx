import type { ReactNode } from 'react';
import type { Submission } from '@/types';
import { relativeTime } from '@/lib/relativeTime';
import { STAGE_BY_ID, stageOf } from '@/lib/stages';
import { PaymentCell } from '@/components/builder/PaymentCell';
import { formatDateTime } from '../entriesTypes';
import { CopyAction } from './CopyAction';
import classes from './ResponseDetails.module.css';

function Item({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className={classes.term}>{term}</dt>
      <dd className={classes.detail}>{children}</dd>
    </>
  );
}

export function ResponseDetails({ submission }: { submission: Submission }) {
  return (
    <dl className={classes.list}>
      <Item term="Submitted">
        {formatDateTime(submission.createdAt)}
        <span className={classes.muted}>· {relativeTime(submission.createdAt)}</span>
      </Item>
      <Item term="Response ID">
        <span className={classes.mono}>{submission._id}</span>
        <CopyAction value={submission._id} label="Copy response ID" />
      </Item>
      <Item term="Source page">
        {submission.sourceUrl ? (
          <>
            <a className={classes.link} href={submission.sourceUrl} target="_blank" rel="noopener noreferrer">
              {submission.sourceUrl}
            </a>
            <CopyAction value={submission.sourceUrl} label="Copy URL" />
          </>
        ) : (
          <span className={classes.muted}>Direct link</span>
        )}
      </Item>
      <Item term="Status">{submission.read ? 'Read' : 'Unread'}</Item>
      <Item term="Stage">{STAGE_BY_ID[stageOf(submission)].label}</Item>
      <Item term="Assignee">
        {submission.assignee || <span className={classes.muted}>Unassigned</span>}
      </Item>
      {submission.leadScore !== undefined && <Item term="Lead score">{submission.leadScore}</Item>}
      {submission.quiz && (
        <Item term="Quiz">
          {submission.quiz.score} of {submission.quiz.total}
          <span className={classes.muted}>
            · {submission.quiz.correct}/{submission.quiz.questions} correct
          </span>
        </Item>
      )}
      {submission.payment && (
        <Item term="Payment">
          <PaymentCell payment={submission.payment} />
        </Item>
      )}
    </dl>
  );
}

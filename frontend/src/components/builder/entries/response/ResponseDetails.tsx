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

function ExternalUrl({ url }: { url: string }) {
  return (
    <>
      <a className={classes.link} href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
      <CopyAction value={url} label="Copy URL" />
    </>
  );
}

export function ResponseDetails({ submission }: { submission: Submission }) {
  const attribution = submission.attribution;
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
      {attribution ? (
        <>
          <Item term="Lead source">{attribution.channel}</Item>
          {attribution.campaign && (
            <Item term="Campaign">
              {attribution.campaign}
              {attribution.medium && <span className={classes.muted}>· {attribution.medium}</span>}
            </Item>
          )}
          {attribution.referrer && (
            <Item term="Came from">
              <ExternalUrl url={attribution.referrer} />
            </Item>
          )}
          {attribution.landingUrl && (
            <Item term="Landing page">
              <ExternalUrl url={attribution.landingUrl} />
            </Item>
          )}
        </>
      ) : (
        <Item term="Source page">
          {submission.sourceUrl ? (
            <ExternalUrl url={submission.sourceUrl} />
          ) : (
            <span className={classes.muted}>Direct link</span>
          )}
        </Item>
      )}
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

import { Tooltip } from '@mantine/core';
import {
  CalendarClockIcon,
  CreditCardIcon,
  GaugeIcon,
  GlobeIcon,
  GraduationCapIcon,
  MailIcon,
  PhoneIcon,
} from 'lucide-react';
import type { Submission } from '@/types';
import type { RespondentIdentity } from '@/lib/respondent';
import { sourceHost } from '@/lib/respondent';
import { formatAmount } from '@/lib/payment';
import { formatDateTime } from '../entriesTypes';
import { CopyAction } from './CopyAction';
import classes from './ResponseHero.module.css';

interface Props {
  submission: Submission;
  identity: RespondentIdentity;
}

export function ResponseHero({ submission, identity }: Props) {
  const host = sourceHost(submission.sourceUrl);
  const payment = submission.payment;
  const quiz = submission.quiz;

  return (
    <section className={classes.hero}>
      <div className={classes.identity}>
        <span className={classes.avatar} aria-hidden>
          {identity.initials}
        </span>
        <div className={classes.who}>
          <div className={classes.name} data-anonymous={!identity.name && !identity.email ? true : undefined}>
            {identity.name ?? identity.email ?? 'Anonymous respondent'}
          </div>
          {(identity.email || identity.phone) && (
            <div className={classes.contacts}>
              {identity.email && (
                <span className={classes.contact}>
                  <MailIcon size={13} className={classes.contactIcon} />
                  <a href={`mailto:${identity.email}`}>{identity.email}</a>
                  <CopyAction value={identity.email} label="Copy email" className={classes.copy} />
                </span>
              )}
              {identity.phone && (
                <span className={classes.contact}>
                  <PhoneIcon size={13} className={classes.contactIcon} />
                  <a href={`tel:${identity.phone}`}>{identity.phone}</a>
                  <CopyAction value={identity.phone} label="Copy phone" className={classes.copy} />
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={classes.chips}>
        <span className={classes.chip}>
          <CalendarClockIcon size={13} />
          <span className={classes.chipText}>{formatDateTime(submission.createdAt)}</span>
        </span>
        {host && (
          <Tooltip label={submission.sourceUrl} withArrow openDelay={300} multiline maw={360}>
            <span className={classes.chip}>
              <GlobeIcon size={13} />
              <span className={classes.chipText}>{host}</span>
            </span>
          </Tooltip>
        )}
        {submission.leadScore !== undefined && (
          <span className={classes.chip} data-tone="score">
            <GaugeIcon size={13} />
            <span className={classes.chipText}>Score {submission.leadScore}</span>
          </span>
        )}
        {quiz && (
          <span className={classes.chip}>
            <GraduationCapIcon size={13} />
            <span className={classes.chipText}>
              Quiz {quiz.score}/{quiz.total}
            </span>
          </span>
        )}
        {payment?.status === 'paid' && (
          <span className={classes.chip} data-tone="paid">
            <CreditCardIcon size={13} />
            <span className={classes.chipText}>Paid {formatAmount(payment.amount, payment.currency)}</span>
          </span>
        )}
      </div>
    </section>
  );
}

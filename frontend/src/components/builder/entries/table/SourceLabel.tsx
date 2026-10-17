import { Tooltip } from '@mantine/core';
import type { Submission } from '@/types';
import { leadChannel } from '@/lib/leadSource';
import classes from '../EntriesTable.module.css';

export function SourceLabel({ submission }: { submission: Submission }) {
  const campaign = submission.attribution?.campaign;
  const label = (
    <span className={classes.source} data-untracked={!submission.attribution || undefined}>
      {leadChannel(submission)}
    </span>
  );
  return campaign ? (
    <Tooltip label={`Campaign: ${campaign}`} withArrow openDelay={300}>
      {label}
    </Tooltip>
  ) : (
    label
  );
}

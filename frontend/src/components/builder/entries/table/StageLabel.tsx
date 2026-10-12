import type { Submission } from '@/types';
import { STAGE_BY_ID, stageOf } from '@/lib/stages';
import toolbar from '../toolbar/EntriesToolbar.module.css';
import classes from './EntryRow.module.css';

export function StageLabel({ submission }: { submission: Submission }) {
  const stage = STAGE_BY_ID[stageOf(submission)];
  return (
    <span className={classes.stage}>
      <span className={toolbar.stageDot} data-color={stage.color} />
      {stage.label}
    </span>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Autocomplete, TagsInput } from '@mantine/core';
import { TagIcon, UserRoundIcon } from 'lucide-react';
import type { Submission } from '@/types';
import { stageOf } from '@/lib/stages';
import { DOCS } from '@/lib/docs';
import { DocsLink } from '@/components/ui/DocsLink';
import { StagePicker } from './StagePicker';
import type { PipelineHandlers } from './types';
import classes from './LeadBar.module.css';

interface Props {
  submission: Submission;
  pipeline: PipelineHandlers;
}

export function LeadBar({ submission, pipeline }: Props) {
  const [assignee, setAssignee] = useState(submission.assignee ?? '');
  const committed = useRef(submission.assignee ?? '');

  useEffect(() => {
    setAssignee(submission.assignee ?? '');
    committed.current = submission.assignee ?? '';
  }, [submission._id, submission.assignee]);

  const commitAssignee = (value: string) => {
    const next = value.trim();
    if (next === committed.current) return;
    committed.current = next;
    void pipeline.onPatch(submission, { assignee: next });
  };

  return (
    <section className={classes.card} aria-label="Lead">
      <div className={classes.head}>
        <span className={classes.title}>Pipeline</span>
        <DocsLink path={DOCS.pipeline} label="How it works" />
      </div>

      <StagePicker
        value={stageOf(submission)}
        disabled={pipeline.readOnly}
        onChange={(stage) => void pipeline.onPatch(submission, { stage })}
      />

      <div className={classes.fields}>
        <Autocomplete
          size="xs"
          placeholder="Assign to…"
          aria-label="Assignee"
          leftSection={<UserRoundIcon size={14} className={classes.fieldIcon} />}
          data={pipeline.facets.assignees}
          value={assignee}
          disabled={pipeline.readOnly}
          onChange={setAssignee}
          onOptionSubmit={commitAssignee}
          onBlur={() => commitAssignee(assignee)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitAssignee(assignee);
          }}
        />
        <TagsInput
          size="xs"
          placeholder={(submission.tags ?? []).length ? '' : 'Add tags'}
          aria-label="Tags"
          leftSection={<TagIcon size={14} className={classes.fieldIcon} />}
          data={pipeline.facets.tags}
          value={submission.tags ?? []}
          maxTags={20}
          disabled={pipeline.readOnly}
          onChange={(tags) => void pipeline.onPatch(submission, { tags })}
        />
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Autocomplete, Badge, Select, TagsInput } from '@mantine/core';
import type { PipelineFacets, PipelinePatch, Submission, SubmissionStage } from '@/types';
import { STAGES, stageOf } from '@/lib/stages';
import { LeadNotes } from './LeadNotes';
import { DocsLink } from '@/components/ui/DocsLink';
import { DOCS } from '@/lib/docs';
import classes from './LeadPanel.module.css';

export interface PipelineHandlers {
  facets: PipelineFacets;
  onPatch: (submission: Submission, patch: PipelinePatch) => Promise<void>;
  onAddNote: (submission: Submission, text: string) => Promise<void>;
  onDeleteNote: (submission: Submission, noteId: string) => Promise<void>;
  readOnly?: boolean;
}

const STAGE_OPTIONS = STAGES.map((stage) => ({ value: stage.id, label: stage.label }));

export function LeadPanel({ submission, pipeline }: { submission: Submission; pipeline: PipelineHandlers }) {
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
    <section className={classes.panel} aria-label="Lead">
      <div className={classes.heading}>
        <span className={classes.label}>Lead</span>
        {submission.leadScore !== undefined && (
          <Badge variant="light" color="grape">
            Score {submission.leadScore}
          </Badge>
        )}
      </div>
      <DocsLink path={DOCS.pipeline} label="Using the lead pipeline" />

      <div className={classes.grid}>
        <Select
          size="xs"
          label="Stage"
          data={STAGE_OPTIONS}
          value={stageOf(submission)}
          allowDeselect={false}
          disabled={pipeline.readOnly}
          onChange={(stage) => stage && void pipeline.onPatch(submission, { stage: stage as SubmissionStage })}
        />
        <Autocomplete
          size="xs"
          label="Assignee"
          placeholder="Unassigned"
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
          className={classes.full}
          size="xs"
          label="Tags"
          placeholder="Add a tag"
          data={pipeline.facets.tags}
          value={submission.tags ?? []}
          maxTags={20}
          disabled={pipeline.readOnly}
          onChange={(tags) => void pipeline.onPatch(submission, { tags })}
        />
      </div>

      <span className={classes.label}>Notes</span>
      <LeadNotes
        notes={submission.notes ?? []}
        onAdd={(text) => pipeline.onAddNote(submission, text)}
        onDelete={(noteId) => pipeline.onDeleteNote(submission, noteId)}
        disabled={pipeline.readOnly}
      />
    </section>
  );
}

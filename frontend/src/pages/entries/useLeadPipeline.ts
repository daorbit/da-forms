import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  addSubmissionNote,
  bulkUpdateSubmissions,
  deleteSubmissionNote,
  updateSubmission,
} from '@/lib/api';
import { notify } from '@/lib/notify';
import { STAGE_BY_ID } from '@/lib/stages';
import type { PipelineFacets, PipelinePatch, Submission, SubmissionStage } from '@/types';
import type { PipelineHandlers } from '@/components/builder/entries/response/types';

const EMPTY_FACETS: PipelineFacets = { assignees: [], tags: [] };

interface Params {
  formId?: string;
  workspaceId: string;
  readOnly: boolean;
  setSubmissions: Dispatch<SetStateAction<Submission[]>>;
  setViewing: Dispatch<SetStateAction<Submission | null>>;
}

function withValues(list: string[], values: string[]): string[] {
  const missing = values.filter((value) => value && !list.includes(value));
  return missing.length ? [...list, ...missing].sort((a, b) => a.localeCompare(b)) : list;
}

export function useLeadPipeline({ formId, workspaceId, readOnly, setSubmissions, setViewing }: Params) {
  const [facets, setFacets] = useState<PipelineFacets>(EMPTY_FACETS);

  const replace = useCallback(
    (updated: Submission) => {
      setSubmissions((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
      setViewing((current) => (current?._id === updated._id ? updated : current));
    },
    [setSubmissions, setViewing]
  );

  const learnFacets = useCallback((patch: PipelinePatch) => {
    setFacets((prev) => ({
      assignees: patch.assignee ? withValues(prev.assignees, [patch.assignee]) : prev.assignees,
      tags: patch.tags ? withValues(prev.tags, patch.tags) : prev.tags,
    }));
  }, []);

  const patchSubmission = useCallback(
    async (submissionId: string, patch: PipelinePatch) => {
      if (!formId) return;
      try {
        replace(await updateSubmission(formId, submissionId, patch, workspaceId));
        learnFacets(patch);
      } catch {
        notify.error('Could not update this response');
      }
    },
    [formId, workspaceId, replace, learnFacets]
  );

  const bulkSetStage = useCallback(
    async (ids: string[], stage: SubmissionStage) => {
      if (!formId || ids.length === 0) return;
      try {
        await bulkUpdateSubmissions(formId, ids, { stage }, workspaceId);
        const moved = new Set(ids);
        setSubmissions((prev) => prev.map((s) => (moved.has(s._id) ? { ...s, stage } : s)));
        notify.success(`${ids.length} responses moved to ${STAGE_BY_ID[stage].label}`);
      } catch {
        notify.error('Could not move those responses');
      }
    },
    [formId, workspaceId, setSubmissions]
  );

  const handlers: PipelineHandlers = useMemo(
    () => ({
      facets,
      readOnly,
      onPatch: (submission, patch) => patchSubmission(submission._id, patch),
      onAddNote: async (submission, text) => {
        if (!formId) return;
        try {
          replace(await addSubmissionNote(formId, submission._id, text, workspaceId));
        } catch {
          notify.error('Could not save the note');
          throw new Error('note_failed');
        }
      },
      onDeleteNote: async (submission, noteId) => {
        if (!formId) return;
        try {
          replace(await deleteSubmissionNote(formId, submission._id, noteId, workspaceId));
        } catch {
          notify.error('Could not delete the note');
        }
      },
    }),
    [facets, readOnly, patchSubmission, formId, workspaceId, replace]
  );

  return { facets, setFacets, handlers, patchSubmission, bulkSetStage };
}

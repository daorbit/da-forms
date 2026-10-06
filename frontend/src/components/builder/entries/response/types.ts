import type { FormField, PipelineFacets, PipelinePatch, Submission } from '@/types';

export interface PipelineHandlers {
  facets: PipelineFacets;
  onPatch: (submission: Submission, patch: PipelinePatch) => Promise<void>;
  onAddNote: (submission: Submission, text: string) => Promise<void>;
  onDeleteNote: (submission: Submission, noteId: string) => Promise<void>;
  readOnly?: boolean;
}

export type ResponseColumn = FormField & { retired?: boolean };

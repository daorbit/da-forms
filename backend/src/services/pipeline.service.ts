import { randomUUID } from 'node:crypto';
import { SubmissionModel, SUBMISSION_STAGES, type SubmissionStage } from '../models/submission.model.js';

export const MAX_NOTES = 200;
export const MAX_NOTE_LENGTH = 2000;
export const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;
const MAX_ASSIGNEE_LENGTH = 80;
const MAX_FACETS = 50;

export interface PipelinePatch {
  stage?: SubmissionStage;
  assignee?: string;
  tags?: string[];
}

export interface PipelineFacets {
  assignees: string[];
  tags: string[];
}

export type PipelineSort = 'newest' | 'oldest' | 'score';

export function isStage(value: unknown): value is SubmissionStage {
  return typeof value === 'string' && (SUBMISSION_STAGES as readonly string[]).includes(value);
}

export function readPipelinePatch(body: Record<string, unknown>): PipelinePatch {
  const patch: PipelinePatch = {};
  if (isStage(body.stage)) patch.stage = body.stage;
  if (typeof body.assignee === 'string') patch.assignee = body.assignee.trim().slice(0, MAX_ASSIGNEE_LENGTH);
  if (Array.isArray(body.tags)) {
    patch.tags = [
      ...new Set(
        body.tags
          .filter((tag): tag is string => typeof tag === 'string')
          .map((tag) => tag.trim().slice(0, MAX_TAG_LENGTH))
          .filter(Boolean)
      ),
    ].slice(0, MAX_TAGS);
  }
  return patch;
}

export function stageFilter(stage: SubmissionStage) {
  return stage === 'new' ? { $in: ['new', null] } : stage;
}

export function sortFor(sort: PipelineSort | undefined): Record<string, 1 | -1> {
  if (sort === 'oldest') return { createdAt: 1 };
  if (sort === 'score') return { leadScore: -1, createdAt: -1 };
  return { createdAt: -1 };
}

export async function pipelineFacets(formId: string): Promise<PipelineFacets> {
  const filter = { formId, status: 'complete' };
  const [assignees, tags] = await Promise.all([
    SubmissionModel.distinct('assignee', filter),
    SubmissionModel.distinct('tags', filter),
  ]);
  const clean = (values: unknown[]) =>
    values
      .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, MAX_FACETS);
  return { assignees: clean(assignees), tags: clean(tags) };
}

export function addNote(submissionId: string, formId: string, text: string) {
  const note = { id: randomUUID(), text: text.slice(0, MAX_NOTE_LENGTH), createdAt: new Date() };
  return SubmissionModel.findOneAndUpdate(
    { _id: submissionId, formId, status: 'complete' },
    { $push: { notes: { $each: [note], $slice: -MAX_NOTES } } },
    { new: true }
  );
}

export function removeNote(submissionId: string, formId: string, noteId: string) {
  return SubmissionModel.findOneAndUpdate(
    { _id: submissionId, formId, status: 'complete' },
    { $pull: { notes: { id: noteId } } },
    { new: true }
  );
}

import type { Submission, SubmissionStage } from '@/types';

export interface StageMeta {
  id: SubmissionStage;
  label: string;
  color: string;
}

export const STAGES: StageMeta[] = [
  { id: 'new', label: 'New', color: 'gray' },
  { id: 'contacted', label: 'Contacted', color: 'blue' },
  { id: 'qualified', label: 'Qualified', color: 'violet' },
  { id: 'won', label: 'Won', color: 'teal' },
  { id: 'lost', label: 'Lost', color: 'red' },
];

export const STAGE_BY_ID: Record<SubmissionStage, StageMeta> = Object.fromEntries(
  STAGES.map((stage) => [stage.id, stage])
) as Record<SubmissionStage, StageMeta>;

export function stageOf(submission: Pick<Submission, 'stage'>): SubmissionStage {
  return submission.stage ?? 'new';
}

export function formHasLeadScore(fields: { optionValues?: Record<string, number> }[]): boolean {
  return fields.some((field) => field.optionValues && Object.keys(field.optionValues).length > 0);
}

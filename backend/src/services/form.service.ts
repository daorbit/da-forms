import { FormModel } from '../models/form.model.js';
import { SubmissionModel } from '../models/submission.model.js';
import type { FormField, SubmitButtonWidth, FormTheme } from '../models/form.model.js';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

const sortMap = {
  name: { title: 1 as const },
  nameDesc: { title: -1 as const },
  date: { createdAt: -1 as const },
  dateAsc: { createdAt: 1 as const },
  status: { status: 1 as const },
};

export interface WorkspaceStats {
  totalForms: number;
  publishedForms: number;
  draftForms: number;
  totalViews: number;
  totalSubmissions: number;
}

export interface FormListResult extends Paginated<InstanceType<typeof FormModel>> {
  /** Workspace-wide, unaffected by the current search/page — the stat tiles above the list. */
  stats: WorkspaceStats;
}

export async function listForms(
  workspaceId: string,
  options: { page?: number; limit?: number; q?: string; sort?: keyof typeof sortMap } = {}
): Promise<FormListResult> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, options.limit ?? 10);
  const filter: Record<string, unknown> = { workspaceId };
  if (options.q) filter.title = { $regex: options.q, $options: 'i' };
  const sort = sortMap[options.sort ?? 'date'];

  const [items, total, allForms] = await Promise.all([
    FormModel.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    FormModel.countDocuments(filter),
    // Unfiltered — the stat tiles reflect the whole workspace, not the
    // current search, so this cannot reuse the `filter` query above.
    FormModel.find({ workspaceId }, { status: 1, viewCount: 1 }),
  ]);

  const formIds = allForms.map((f) => f._id);
  const [totalSubmissions, publishedForms] = await Promise.all([
    formIds.length ? SubmissionModel.countDocuments({ formId: { $in: formIds } }) : 0,
    allForms.filter((f) => f.status === 'published').length,
  ]);

  return {
    items,
    total,
    page,
    limit,
    stats: {
      totalForms: allForms.length,
      publishedForms,
      draftForms: allForms.length - publishedForms,
      totalViews: allForms.reduce((sum, f) => sum + (f.viewCount ?? 0), 0),
      totalSubmissions,
    },
  };
}

export function getForm(id: string) {
  return FormModel.findById(id);
}

export function createForm(input: {
  title: string;
  description?: string;
  workspaceId: string;
  fields: FormField[];
  redirectUrl?: string;
  thankYouMessage?: string;
  hideHeader?: boolean;
  labelPlacement?: 'top' | 'left' | 'right';
  submitLabel?: string;
  submitButtonSize?: 'small' | 'medium' | 'large';
  submitButtonWidth?: SubmitButtonWidth;
  theme?: FormTheme;
  collectIp?: boolean;
}) {
  return FormModel.create(input);
}

export function updateForm(
  id: string,
  workspaceId: string,
  input: Partial<{
    title: string;
    description: string;
    fields: FormField[];
    status: 'draft' | 'published';
    redirectUrl: string;
    thankYouMessage: string;
    hideHeader: boolean;
    labelPlacement: 'top' | 'left' | 'right';
    submitLabel: string;
    submitButtonSize: 'small' | 'medium' | 'large';
    submitButtonWidth: SubmitButtonWidth;
    theme: FormTheme;
    collectIp: boolean;
  }>
) {
  return FormModel.findOneAndUpdate({ _id: id, workspaceId }, input, { new: true });
}

export function deleteForm(id: string, workspaceId: string) {
  return FormModel.findOneAndDelete({ _id: id, workspaceId });
}

export function recordView(id: string) {
  return FormModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
}

/** Every field in document order, grids included — mirrors the frontend's `flattenFields`. */
function flattenFields(fields: FormField[]): FormField[] {
  return fields.flatMap((field) =>
    field.type === 'grid'
      ? [field, ...(field.columns ?? []).flatMap(flattenFields)]
      : [field]
  );
}

export class DuplicateValueError extends Error {
  constructor(public field: FormField) {
    super(`${field.label || 'This field'} must be unique`);
  }
}

export async function submitForm(
  formId: string,
  fields: FormField[],
  data: Record<string, string>,
  sourceUrl?: string
) {
  const uniqueFields = flattenFields(fields).filter((field) => field.unique);
  for (const field of uniqueFields) {
    const value = data[field.id];
    if (!value) continue;
    const existing = await SubmissionModel.exists({ formId, [`data.${field.id}`]: value });
    if (existing) throw new DuplicateValueError(field);
  }
  return SubmissionModel.create({ formId, data, sourceUrl });
}

export function submissionCount(formId: string) {
  return SubmissionModel.countDocuments({ formId });
}

export interface SourceBreakdownEntry {
  /** The referring page's hostname, or 'direct' when no referrer was sent. */
  source: string;
  count: number;
}

/** Submissions grouped by referrer hostname, most common first. */
export async function sourceBreakdown(formId: string): Promise<SourceBreakdownEntry[]> {
  const submissions = await SubmissionModel.find({ formId }, { sourceUrl: 1 });
  const counts = new Map<string, number>();
  for (const submission of submissions) {
    let source = 'Direct';
    if (submission.sourceUrl) {
      try {
        source = new URL(submission.sourceUrl).hostname;
      } catch {
        // Malformed referrer header — count it rather than drop the submission from the breakdown.
        source = 'Other';
      }
    }
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

export async function listSubmissions(
  formId: string,
  options: {
    page?: number;
    limit?: number;
    status?: 'all' | 'read' | 'unread' | 'starred';
    from?: string;
    to?: string;
  } = {}
): Promise<Paginated<InstanceType<typeof SubmissionModel>>> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, options.limit ?? 10);
  const filter: Record<string, unknown> = { formId };

  if (options.status === 'read') filter.read = true;
  else if (options.status === 'unread') filter.read = false;
  else if (options.status === 'starred') filter.starred = true;

  if (options.from || options.to) {
    const createdAt: Record<string, Date> = {};
    if (options.from) createdAt.$gte = new Date(options.from);
    if (options.to) createdAt.$lte = new Date(options.to);
    filter.createdAt = createdAt;
  }

  const [items, total] = await Promise.all([
    SubmissionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    SubmissionModel.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export function updateSubmission(
  id: string,
  formId: string,
  patch: Partial<{ read: boolean; starred: boolean }>
) {
  return SubmissionModel.findOneAndUpdate({ _id: id, formId }, patch, { new: true });
}

export function deleteSubmission(id: string, formId: string) {
  return SubmissionModel.findOneAndDelete({ _id: id, formId });
}

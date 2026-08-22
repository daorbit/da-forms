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

export async function listForms(
  workspaceId: string,
  options: { page?: number; limit?: number; q?: string; sort?: keyof typeof sortMap } = {}
): Promise<Paginated<InstanceType<typeof FormModel>>> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, options.limit ?? 10);
  const filter: Record<string, unknown> = { workspaceId };
  if (options.q) filter.title = { $regex: options.q, $options: 'i' };
  const sort = sortMap[options.sort ?? 'date'];

  const [items, total] = await Promise.all([
    FormModel.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    FormModel.countDocuments(filter),
  ]);

  return { items, total, page, limit };
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

export function submitForm(formId: string, data: Record<string, string>, sourceUrl?: string) {
  return SubmissionModel.create({ formId, data, sourceUrl });
}

export function submissionCount(formId: string) {
  return SubmissionModel.countDocuments({ formId });
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

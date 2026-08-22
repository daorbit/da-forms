import { FormModel } from '../models/form.model.js';
import { SubmissionModel } from '../models/submission.model.js';
import type { FormField } from '../models/form.model.js';

export function listForms(workspaceId: string) {
  return FormModel.find({ workspaceId }).sort({ createdAt: -1 });
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
    collectIp: boolean;
  }>
) {
  return FormModel.findOneAndUpdate({ _id: id, workspaceId }, input, { new: true });
}

export function deleteForm(id: string, workspaceId: string) {
  return FormModel.findOneAndDelete({ _id: id, workspaceId });
}

export function submitForm(formId: string, data: Record<string, string>, sourceUrl?: string) {
  return SubmissionModel.create({ formId, data, sourceUrl });
}

export function listSubmissions(formId: string) {
  return SubmissionModel.find({ formId }).sort({ createdAt: -1 });
}

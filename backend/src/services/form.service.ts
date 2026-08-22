import { FormModel } from '../models/form.model.js';
import { SubmissionModel } from '../models/submission.model.js';
import type { FormField } from '../models/form.model.js';

export function listForms(projectKey: string) {
  return FormModel.find({ projectKey }).sort({ createdAt: -1 });
}

export function getForm(id: string) {
  return FormModel.findById(id);
}

export function createForm(input: {
  title: string;
  description?: string;
  projectKey: string;
  fields: FormField[];
  redirectUrl?: string;
  thankYouMessage?: string;
  hideHeader?: boolean;
}) {
  return FormModel.create(input);
}

export function updateForm(
  id: string,
  input: Partial<{
    title: string;
    description: string;
    fields: FormField[];
    status: 'draft' | 'published';
    redirectUrl: string;
    thankYouMessage: string;
    hideHeader: boolean;
  }>
) {
  return FormModel.findByIdAndUpdate(id, input, { new: true });
}

export function deleteForm(id: string) {
  return FormModel.findByIdAndDelete(id);
}

export function submitForm(formId: string, data: Record<string, string>, sourceUrl?: string) {
  return SubmissionModel.create({ formId, data, sourceUrl });
}

export function listSubmissions(formId: string) {
  return SubmissionModel.find({ formId }).sort({ createdAt: -1 });
}

import { Types } from 'mongoose';
import { FormModel, type FormField } from '../models/form.model.js';
import { SubmissionModel } from '../models/submission.model.js';
import { flattenFields } from '../lib/pipe.js';

const MAX_FORMS = 200;
const MAX_CONTACTS = 25_000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface LeadContact {
  email: string;
  name?: string;
}

function contactFields(fields: FormField[]) {
  const all = flattenFields(fields);
  return {
    emailIds: all.filter((field) => field.type === 'email').map((field) => field.id),
    nameId: all.find((field) => field.type === 'name')?.id,
  };
}

export async function leadSources(workspaceId: string) {
  const forms = await FormModel.find({ workspaceId }).select('title fields').limit(MAX_FORMS).lean();
  const usable = forms.filter((form) => contactFields(form.fields ?? []).emailIds.length > 0);

  const counts = await SubmissionModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { formId: { $in: usable.map((form) => form._id) }, status: 'complete' } },
    { $group: { _id: '$formId', count: { $sum: 1 } } },
  ]);
  const byForm = new Map(counts.map((row) => [String(row._id), row.count]));

  return usable.map((form) => ({
    id: String(form._id),
    title: form.title,
    responses: byForm.get(String(form._id)) ?? 0,
  }));
}

async function contactsFromForm(formId: Types.ObjectId, fields: FormField[]): Promise<LeadContact[]> {
  const { emailIds, nameId } = contactFields(fields);
  if (!emailIds.length) return [];

  const projected = [...emailIds, ...(nameId ? [nameId] : [])].map((id) => `data.${id}`).join(' ');
  const rows = await SubmissionModel.find({ formId, status: 'complete' })
    .select(projected)
    .sort({ createdAt: -1 })
    .limit(MAX_CONTACTS)
    .lean();

  return rows.flatMap((row) => {
    const data = (row.data ?? {}) as Record<string, unknown>;
    const email = emailIds
      .map((id) => String(data[id] ?? '').trim().toLowerCase())
      .find((value) => EMAIL.test(value));
    if (!email) return [];
    const name = nameId ? String(data[nameId] ?? '').trim() : '';
    return [{ email, ...(name ? { name } : {}) }];
  });
}

export async function leadContacts(workspaceId: string, formIds: unknown): Promise<LeadContact[]> {
  const ids = Array.isArray(formIds) ? formIds.map(String).filter((id) => Types.ObjectId.isValid(id)) : [];
  if (!ids.length) return [];

  const forms = await FormModel.find({ _id: { $in: ids }, workspaceId }).select('fields').lean();
  const lists = await Promise.all(forms.map((form) => contactsFromForm(form._id, form.fields ?? [])));

  const unique = new Map<string, LeadContact>();
  for (const contact of lists.flat()) {
    if (!unique.has(contact.email)) unique.set(contact.email, contact);
    if (unique.size >= MAX_CONTACTS) break;
  }
  return [...unique.values()];
}

import { Types, type PipelineStage } from 'mongoose';
import { FormModel } from '../models/form.model.js';
import { SubmissionModel } from '../models/submission.model.js';
import { NOT_TRACKED } from '../lib/attribution.js';

export interface LeadSourceEntry {
  source: string;
  count: number;
  won: number;
}

const MAX_SOURCES = 50;
const MAX_FORMS = 500;

function breakdown(match: PipelineStage.Match['$match']): Promise<LeadSourceEntry[]> {
  return SubmissionModel.aggregate<LeadSourceEntry>([
    { $match: match },
    {
      $group: {
        _id: { $ifNull: ['$attribution.channel', NOT_TRACKED] },
        count: { $sum: 1 },
        won: { $sum: { $cond: [{ $eq: ['$stage', 'won'] }, 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
    { $limit: MAX_SOURCES },
    { $project: { _id: 0, source: '$_id', count: 1, won: 1 } },
  ]);
}

export function formLeadSources(formId: string): Promise<LeadSourceEntry[]> {
  return breakdown({ formId: new Types.ObjectId(formId), status: 'complete' });
}

export async function workspaceLeadSources(workspaceId: string, since?: Date) {
  const forms = await FormModel.find({ workspaceId }, { _id: 1 }).limit(MAX_FORMS).lean();
  if (!forms.length) return { sources: [], forms: 0 };

  const sources = await breakdown({
    formId: { $in: forms.map((f) => f._id) },
    status: 'complete',
    ...(since ? { createdAt: { $gte: since } } : {}),
  });
  return { sources, forms: forms.length };
}

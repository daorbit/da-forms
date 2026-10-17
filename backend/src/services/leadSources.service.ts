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
const LEGACY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

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

function recentLegacyEmbeds(formId: Types.ObjectId | { $in: Types.ObjectId[] }): Promise<number> {
  return SubmissionModel.countDocuments({
    formId,
    status: 'complete',
    createdAt: { $gte: new Date(Date.now() - LEGACY_WINDOW_MS) },
    'attribution.legacyEmbed': true,
  });
}

export function formLeadSources(formId: string): Promise<LeadSourceEntry[]> {
  return breakdown({ formId: new Types.ObjectId(formId), status: 'complete' });
}

export function formLegacyEmbeds(formId: string): Promise<number> {
  return recentLegacyEmbeds(new Types.ObjectId(formId));
}

export async function workspaceLeadSources(workspaceId: string, since?: Date) {
  const forms = await FormModel.find({ workspaceId }, { _id: 1 }).limit(MAX_FORMS).lean();
  if (!forms.length) return { sources: [], forms: 0, legacyEmbeds: 0 };

  const formIds = { $in: forms.map((f) => f._id) };
  const [sources, legacyEmbeds] = await Promise.all([
    breakdown({
      formId: formIds,
      status: 'complete',
      ...(since ? { createdAt: { $gte: since } } : {}),
    }),
    recentLegacyEmbeds(formIds),
  ]);
  return { sources, forms: forms.length, legacyEmbeds };
}

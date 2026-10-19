import { FormModel } from '../models/form.model.js';
import { SubmissionModel, SUBMISSION_STAGES, type SubmissionStage } from '../models/submission.model.js';
import { BookingModel } from '../models/booking.model.js';
import type { SummaryWindow } from '../lib/summaryWindow.js';

const MAX_FORMS = 500;
const UPCOMING_LIMIT = 10;

async function workspaceForms(workspaceId: string) {
  return FormModel.find({ workspaceId }, { _id: 1, name: 1, title: 1 }).limit(MAX_FORMS).lean();
}

function formLabel(form: { name?: string; title?: string }) {
  return form.name || form.title || 'Untitled form';
}

export async function pipelineSummary(workspaceId: string, window: SummaryWindow) {
  const forms = await workspaceForms(workspaceId);
  const empty = Object.fromEntries(SUBMISSION_STAGES.map((s) => [s, 0])) as Record<SubmissionStage, number>;
  if (!forms.length) return { total: 0, byStage: empty, averageLeadScore: null, scoredLeads: 0, topForms: [] };

  const match = {
    formId: { $in: forms.map((f) => f._id) },
    status: 'complete',
    createdAt: { $gte: window.since, $lte: window.until },
  };

  const [stages, perForm] = await Promise.all([
    SubmissionModel.aggregate<{ _id: SubmissionStage | null; count: number; scored: number; scoreSum: number }>([
      { $match: match },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          scored: { $sum: { $cond: [{ $isNumber: '$leadScore' }, 1, 0] } },
          scoreSum: { $sum: { $ifNull: ['$leadScore', 0] } },
        },
      },
    ]),
    SubmissionModel.aggregate<{ _id: unknown; count: number }>([
      { $match: match },
      { $group: { _id: '$formId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const byStage = { ...empty };
  let total = 0;
  let scored = 0;
  let scoreSum = 0;
  for (const row of stages) {
    const stage = row._id && row._id in byStage ? row._id : 'new';
    byStage[stage] += row.count;
    total += row.count;
    scored += row.scored;
    scoreSum += row.scoreSum;
  }

  const nameById = new Map(forms.map((f) => [String(f._id), formLabel(f)]));
  return {
    total,
    byStage,
    averageLeadScore: scored ? Math.round((scoreSum / scored) * 10) / 10 : null,
    scoredLeads: scored,
    topForms: perForm.map((r) => ({ formId: String(r._id), name: nameById.get(String(r._id)) ?? '', leads: r.count })),
  };
}

export async function bookingSummary(workspaceId: string, window: SummaryWindow, now = new Date()) {
  const base = { workspaceId, status: 'confirmed' as const };

  const [inWindow, upcoming, forms] = await Promise.all([
    BookingModel.aggregate<{ _id: unknown; count: number }>([
      { $match: { ...base, start: { $gte: window.since, $lte: window.until } } },
      { $group: { _id: '$formId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    BookingModel.find({ ...base, start: { $gte: now } }, { formId: 1, start: 1, end: 1 })
      .sort({ start: 1 })
      .limit(UPCOMING_LIMIT)
      .lean(),
    workspaceForms(workspaceId),
  ]);

  const nameById = new Map(forms.map((f) => [String(f._id), formLabel(f)]));
  return {
    total: inWindow.reduce((sum, r) => sum + r.count, 0),
    byForm: inWindow.slice(0, 10).map((r) => ({
      formId: String(r._id),
      name: nameById.get(String(r._id)) ?? '',
      bookings: r.count,
    })),
    upcoming: upcoming.map((b) => ({
      formId: String(b.formId),
      formName: nameById.get(String(b.formId)) ?? '',
      start: b.start,
      end: b.end,
    })),
  };
}

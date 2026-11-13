import { FormModel } from '../models/form.model.js';
import { SubmissionModel } from '../models/submission.model.js';
import type { SummaryWindow } from '../lib/summaryWindow.js';

const MAX_FORMS = 500;
const RAW_ROWS = 500;
const PAGE_ROWS = 100;

export interface LeadPage {
  host: string;
  path: string;
  leads: number;
}

export interface LeadPages {
  total: number;
  withLanding: number;
  pages: LeadPage[];
}

type Facet = {
  totals: { _id: null; total: number; withLanding: number }[];
  urls: { _id: string; count: number }[];
};

function pageOf(raw: string): { host: string; path: string } | null {
  try {
    const url = new URL(raw);
    const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : '/';
    return { host: url.hostname.replace(/^www\./i, '').toLowerCase(), path: path || '/' };
  } catch {
    return null;
  }
}

export async function leadPages(workspaceId: string, window: SummaryWindow): Promise<LeadPages> {
  const forms = await FormModel.find({ workspaceId }, { _id: 1 }).limit(MAX_FORMS).lean();
  if (!forms.length) return { total: 0, withLanding: 0, pages: [] };

  const [rows] = await SubmissionModel.aggregate<Facet>([
    {
      $match: {
        formId: { $in: forms.map((f) => f._id) },
        status: 'complete',
        createdAt: { $gte: window.since, $lte: window.until },
      },
    },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              withLanding: { $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$attribution.landingUrl', ''] } }, 0] }, 1, 0] } },
            },
          },
        ],
        urls: [
          { $match: { 'attribution.landingUrl': { $nin: [null, ''] } } },
          {
            $group: {
              _id: { $arrayElemAt: [{ $split: [{ $arrayElemAt: [{ $split: ['$attribution.landingUrl', '#'] }, 0] }, '?'] }, 0] },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: RAW_ROWS },
        ],
      },
    },
  ]);

  const byPage = new Map<string, LeadPage>();
  for (const row of rows?.urls ?? []) {
    const page = pageOf(row._id);
    if (!page) continue;
    const key = `${page.host}${page.path}`;
    const existing = byPage.get(key);
    if (existing) existing.leads += row.count;
    else byPage.set(key, { ...page, leads: row.count });
  }

  const totals = rows?.totals[0];
  return {
    total: totals?.total ?? 0,
    withLanding: totals?.withLanding ?? 0,
    pages: [...byPage.values()].sort((a, b) => b.leads - a.leads).slice(0, PAGE_ROWS),
  };
}

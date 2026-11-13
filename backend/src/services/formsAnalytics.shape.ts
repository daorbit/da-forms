import type { AnalyticsWindow } from '../lib/analyticsWindow.js';
import type { SubmissionRows, ViewRows } from './formsAnalytics.queries.js';

export interface AnalyticsFormRef {
  id: string;
  title: string;
  status: 'draft' | 'published';
}

export interface PeriodTotals {
  views: number;
  responses: number;
  abandoned: number;
  completionRate: number;
}

export interface FormPerformance extends AnalyticsFormRef {
  views: number;
  responses: number;
  abandoned: number;
  completionRate: number;
  responsesChange: number | null;
  previousViews: number;
  previousResponses: number;
}

export interface FormsAnalytics {
  range: AnalyticsWindow['range'];
  formId: string | null;
  forms: AnalyticsFormRef[];
  totals: PeriodTotals;
  previous: PeriodTotals;
  daily: { date: string; views: number; responses: number; abandoned: number }[];
  performance: FormPerformance[];
  sources: { source: string; count: number; won: number }[];
  campaigns: { campaign: string; count: number }[];
  heatmap: { day: number; hour: number; count: number }[];
  stages: { stage: string; count: number }[];
  leadScore: { average: number; scored: number } | null;
  devices: { device: string; count: number }[];
  duration: { averageMs: number; timed: number } | null;
  revenue: { currency: string; amount: number; payments: number }[];
  dropOff: { fieldId: string; label: string; index: number; abandoned: number }[];
  partialsEnabled: boolean;
}

export function rate(responses: number, views: number): number {
  return views > 0 ? Math.min(1, responses / views) : 0;
}

export function change(now: number, before: number): number | null {
  return before > 0 ? Math.round(((now - before) / before) * 100) : null;
}

function totalsOf(views: number, responses: number, abandoned: number): PeriodTotals {
  return { views, responses, abandoned, completionRate: rate(responses, views) };
}

type FormBucket = { views: number; responses: number; abandoned: number };
const emptyBucket = (): FormBucket => ({ views: 0, responses: 0, abandoned: 0 });

export function shapePeriods(forms: AnalyticsFormRef[], views: ViewRows, submissions: SubmissionRows, window: AnalyticsWindow) {
  const now = new Map<string, FormBucket>();
  const before = new Map<string, FormBucket>();
  const bucket = (map: Map<string, FormBucket>, id: string) => {
    let row = map.get(id);
    if (!row) map.set(id, (row = emptyBucket()));
    return row;
  };

  for (const row of views.byForm) {
    bucket(row._id.current ? now : before, String(row._id.formId)).views += row.count;
  }
  for (const row of submissions.byForm) {
    const target = bucket(row._id.current ? now : before, String(row._id.formId));
    if (row._id.status === 'partial') target.abandoned += row.count;
    else target.responses += row.count;
  }

  const sum = (map: Map<string, FormBucket>) =>
    [...map.values()].reduce((acc, row) => ({
      views: acc.views + row.views,
      responses: acc.responses + row.responses,
      abandoned: acc.abandoned + row.abandoned,
    }), emptyBucket());

  const total = sum(now);
  const prior = sum(before);

  const performance: FormPerformance[] = forms
    .map((form) => {
      const current = now.get(form.id) ?? emptyBucket();
      const previous = before.get(form.id) ?? emptyBucket();
      return {
        ...form,
        ...current,
        completionRate: rate(current.responses, current.views),
        responsesChange: change(current.responses, previous.responses),
        previousViews: previous.views,
        previousResponses: previous.responses,
      };
    })
    .sort((a, b) => b.responses - a.responses || b.views - a.views);

  const daily = new Map(window.dates.map((date) => [date, { date, views: 0, responses: 0, abandoned: 0 }]));
  for (const row of views.byDate) {
    const day = daily.get(row._id);
    if (day) day.views = row.count;
  }
  for (const row of submissions.byDay) {
    const day = daily.get(row._id.date);
    if (!day) continue;
    if (row._id.status === 'partial') day.abandoned += row.count;
    else day.responses += row.count;
  }

  return {
    totals: totalsOf(total.views, total.responses, total.abandoned),
    previous: totalsOf(prior.views, prior.responses, prior.abandoned),
    daily: [...daily.values()],
    performance,
  };
}

export function shapeBreakdowns(rows: SubmissionRows) {
  const score = rows.score[0];
  const duration = rows.duration[0];
  return {
    sources: rows.sources.map((r) => ({ source: r._id, count: r.count, won: r.won })),
    campaigns: rows.campaigns.map((r) => ({ campaign: r._id, count: r.count })),
    heatmap: rows.heatmap.map((r) => ({ day: r._id.dow - 1, hour: r._id.hour, count: r.count })),
    stages: rows.stages.map((r) => ({ stage: r._id, count: r.count })).sort((a, b) => b.count - a.count),
    leadScore: score ? { average: Math.round(score.average * 10) / 10, scored: score.scored } : null,
    devices: rows.devices.map((r) => ({ device: r._id, count: r.count })).sort((a, b) => b.count - a.count),
    duration: duration ? { averageMs: Math.round(duration.average), timed: duration.timed } : null,
    revenue: rows.revenue.map((r) => ({ currency: r._id, amount: r.amount, payments: r.payments })),
  };
}

import { Types } from 'mongoose';
import { FormModel } from '../models/form.model.js';
import { flattenFields } from '../lib/pipe.js';
import { createTtlCache } from '../lib/ttlCache.js';
import { analyticsWindow, type AnalyticsRange } from '../lib/analyticsWindow.js';
import { dropOffBreakdown } from './form.service.js';
import { submissionRows, viewRows } from './formsAnalytics.queries.js';
import { shapeBreakdowns, shapePeriods, type AnalyticsFormRef, type FormsAnalytics } from './formsAnalytics.shape.js';
import type { FormField } from '../models/form.model.js';

const MAX_FORMS = 200;
const CACHE_MS = 60_000;

const cache = createTtlCache<FormsAnalytics | null>(CACHE_MS, 300);

interface Query {
  workspaceId: string;
  range: AnalyticsRange;
  timezone: string;
  formId: string | null;
}

type FormRow = {
  _id: Types.ObjectId;
  title: string;
  status: 'draft' | 'published';
  collectPartials?: boolean;
  fields?: FormField[];
};

async function singleFormDropOff(form: FormRow | undefined) {
  if (!form?.collectPartials) return [];
  const labels = new Map(flattenFields(form.fields ?? []).map((f) => [f.id, f.label || 'Untitled question']));
  const rows = await dropOffBreakdown(String(form._id));
  return rows.map((row) => ({ ...row, label: labels.get(row.fieldId) ?? 'Removed question' }));
}

async function compute({ workspaceId, range, timezone, formId }: Query): Promise<FormsAnalytics | null> {
  const window = analyticsWindow(range, timezone);
  const forms = await FormModel.find(
    { workspaceId },
    { _id: 1, title: 1, status: 1, collectPartials: 1, ...(formId ? { fields: 1 } : {}) },
  )
    .sort({ updatedAt: -1 })
    .limit(MAX_FORMS)
    .lean<FormRow[]>();

  const picked = formId ? forms.find((f) => String(f._id) === formId) : undefined;
  if (formId && !picked) return null;

  const refs: AnalyticsFormRef[] = forms.map((f) => ({ id: String(f._id), title: f.title, status: f.status }));
  const scope = picked ? [picked] : forms;
  const ids = scope.map((f) => f._id);

  const [views, submissions, dropOff] = await Promise.all([
    viewRows(ids.map(String), window),
    submissionRows(ids, window),
    singleFormDropOff(picked),
  ]);

  const periods = shapePeriods(
    picked ? refs.filter((r) => r.id === formId) : refs,
    views,
    submissions,
    window,
  );

  return {
    range,
    formId,
    forms: refs,
    ...periods,
    ...shapeBreakdowns(submissions),
    dropOff,
    partialsEnabled: scope.some((f) => f.collectPartials),
  };
}

export function formsAnalytics(query: Query, fresh = false): Promise<FormsAnalytics | null> {
  const key = [query.workspaceId, query.range, query.timezone, query.formId ?? 'all'].join(':');
  if (fresh) cache.forget(key);
  return cache.load(key, () => compute(query));
}

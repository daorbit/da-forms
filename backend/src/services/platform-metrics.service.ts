import { FormModel } from '../models/form.model.js';
import { SubmissionModel } from '../models/submission.model.js';
import { idRange } from '../lib/platform-range.js';

const CACHE_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; value: Promise<unknown> }>();

async function compute(from: Date, to: Date) {
  const inRange = { _id: idRange(from, to) };
  const [forms, published, workspaces, responses, paidResponses] = await Promise.all([
    FormModel.estimatedDocumentCount(),
    FormModel.countDocuments({ status: 'published' }),
    FormModel.distinct('workspaceId'),
    SubmissionModel.countDocuments({ ...inRange, status: 'complete' }),
    SubmissionModel.countDocuments({ ...inRange, 'payment.status': 'paid' }),
  ]);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    users: null,
    paying: null,
    revenue: [],
    extra: [
      { key: 'workspaces', label: 'Workspaces with forms', value: workspaces.length },
      { key: 'forms', label: 'Forms', value: forms },
      { key: 'published', label: 'Published forms', value: published },
      { key: 'responses', label: 'Responses in period', value: responses },
      { key: 'paidResponses', label: 'Paid responses in period', value: paidResponses },
    ],
  };
}

export function platformMetrics(from: Date, to: Date) {
  const key = `${Math.floor(from.getTime() / 60_000)}:${Math.floor(to.getTime() / 60_000)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  if (cache.size > 50) cache.clear();
  const value = compute(from, to);
  cache.set(key, { at: Date.now(), value });
  value.catch(() => cache.delete(key));
  return value;
}
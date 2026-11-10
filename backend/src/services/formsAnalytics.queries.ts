import type { Types } from 'mongoose';
import { FormDailyViewModel } from '../models/formDailyView.model.js';
import { SubmissionModel } from '../models/submission.model.js';
import { NOT_TRACKED } from '../lib/attribution.js';
import type { AnalyticsWindow } from '../lib/analyticsWindow.js';

const LIST_LIMIT = 8;

export interface ViewRows {
  byDate: { _id: string; count: number }[];
  byForm: { _id: { formId: string; current: boolean }; count: number }[];
}

export interface Counted<K> {
  _id: K;
  count: number;
}

export interface SubmissionRows {
  byDay: Counted<{ date: string; status: string }>[];
  byForm: Counted<{ formId: Types.ObjectId; current: boolean; status: string }>[];
  sources: { _id: string; count: number; won: number }[];
  campaigns: Counted<string>[];
  heatmap: Counted<{ dow: number; hour: number }>[];
  stages: Counted<string>[];
  score: { _id: null; average: number; scored: number }[];
  devices: Counted<string>[];
  duration: { _id: null; average: number; timed: number }[];
  revenue: { _id: string; amount: number; payments: number }[];
}

export async function viewRows(formIds: string[], window: AnalyticsWindow): Promise<ViewRows> {
  const [rows] = await FormDailyViewModel.aggregate<ViewRows>([
    { $match: { formId: { $in: formIds }, date: { $gte: window.previousStartDate } } },
    {
      $facet: {
        byDate: [
          { $match: { date: { $gte: window.startDate } } },
          { $group: { _id: '$date', count: { $sum: '$count' } } },
        ],
        byForm: [
          {
            $group: {
              _id: { formId: '$formId', current: { $gte: ['$date', window.startDate] } },
              count: { $sum: '$count' },
            },
          },
        ],
      },
    },
  ]);
  return rows ?? { byDate: [], byForm: [] };
}

export async function submissionRows(formIds: Types.ObjectId[], window: AnalyticsWindow): Promise<SubmissionRows> {
  const current = { createdAt: { $gte: window.start } };
  const completeNow = { $match: { ...current, status: 'complete' } };
  const tz = window.timezone;

  const [rows] = await SubmissionModel.aggregate<SubmissionRows>([
    {
      $match: {
        formId: { $in: formIds },
        status: { $in: ['complete', 'partial'] },
        createdAt: { $gte: window.previousStart },
      },
    },
    {
      $facet: {
        byDay: [
          { $match: current },
          {
            $group: {
              _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, status: '$status' },
              count: { $sum: 1 },
            },
          },
        ],
        byForm: [
          {
            $group: {
              _id: { formId: '$formId', current: { $gte: ['$createdAt', window.start] }, status: '$status' },
              count: { $sum: 1 },
            },
          },
        ],
        sources: [
          completeNow,
          {
            $group: {
              _id: { $ifNull: ['$attribution.channel', NOT_TRACKED] },
              count: { $sum: 1 },
              won: { $sum: { $cond: [{ $eq: ['$stage', 'won'] }, 1, 0] } },
            },
          },
          { $sort: { count: -1 } },
          { $limit: LIST_LIMIT },
        ],
        campaigns: [
          completeNow,
          { $match: { 'attribution.campaign': { $nin: [null, ''] } } },
          { $group: { _id: '$attribution.campaign', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: LIST_LIMIT },
        ],
        heatmap: [
          completeNow,
          {
            $group: {
              _id: {
                dow: { $dayOfWeek: { date: '$createdAt', timezone: tz } },
                hour: { $hour: { date: '$createdAt', timezone: tz } },
              },
              count: { $sum: 1 },
            },
          },
        ],
        stages: [completeNow, { $group: { _id: { $ifNull: ['$stage', 'new'] }, count: { $sum: 1 } } }],
        score: [
          completeNow,
          { $match: { leadScore: { $type: 'number' } } },
          { $group: { _id: null, average: { $avg: '$leadScore' }, scored: { $sum: 1 } } },
        ],
        devices: [
          completeNow,
          { $group: { _id: { $ifNull: ['$respondent.device', 'unknown'] }, count: { $sum: 1 } } },
        ],
        duration: [
          completeNow,
          { $match: { 'respondent.durationMs': { $type: 'number' } } },
          { $group: { _id: null, average: { $avg: '$respondent.durationMs' }, timed: { $sum: 1 } } },
        ],
        revenue: [
          completeNow,
          { $match: { 'payment.status': 'paid' } },
          {
            $group: {
              _id: { $ifNull: ['$payment.currency', 'INR'] },
              amount: { $sum: '$payment.amount' },
              payments: { $sum: 1 },
            },
          },
          { $sort: { amount: -1 } },
        ],
      },
    },
  ]);

  return (
    rows ?? {
      byDay: [], byForm: [], sources: [], campaigns: [], heatmap: [], stages: [],
      score: [], devices: [], duration: [], revenue: [],
    }
  );
}

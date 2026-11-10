export type AnalyticsRange = '7d' | '30d' | '90d';

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
}

export interface AnalyticsDay {
  date: string;
  views: number;
  responses: number;
  abandoned: number;
}

export interface FormsAnalytics {
  range: AnalyticsRange;
  formId: string | null;
  forms: AnalyticsFormRef[];
  totals: PeriodTotals;
  previous: PeriodTotals;
  daily: AnalyticsDay[];
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

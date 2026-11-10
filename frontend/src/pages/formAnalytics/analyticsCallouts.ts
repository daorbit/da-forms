import type { FormsAnalytics } from '@/types/formsAnalytics';
import { change, pct, share } from './analyticsFormat';

export type CalloutTone = 'good' | 'warn' | 'neutral';

export interface Callout {
  key: string;
  tone: CalloutTone;
  text: string;
}

const MIN_VIEWS = 20;
const LOW_COMPLETION = 0.15;
const BIG_MOVE = 20;
const LIMIT = 3;

const DAYS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];

function hourLabel(hour: number): string {
  const suffix = hour < 12 ? 'am' : 'pm';
  return `${hour % 12 || 12}${suffix}`;
}

function trend(data: FormsAnalytics): Callout | null {
  const moved = change(data.totals.responses, data.previous.responses);
  if (moved === null || Math.abs(moved) < BIG_MOVE) return null;
  const up = moved > 0;
  return {
    key: 'trend',
    tone: up ? 'good' : 'warn',
    text: `Responses are ${up ? 'up' : 'down'} ${Math.abs(moved)}% on the previous period.`,
  };
}

function weakForm(data: FormsAnalytics): Callout | null {
  if (data.formId) return null;
  const weak = data.performance
    .filter((f) => f.views >= MIN_VIEWS && f.completionRate < LOW_COMPLETION)
    .sort((a, b) => b.views - a.views)[0];
  if (!weak) return null;
  return {
    key: 'weak',
    tone: 'warn',
    text: `${weak.title} converts only ${pct(weak.completionRate)} of its ${weak.views.toLocaleString()} views.`,
  };
}

function topForm(data: FormsAnalytics): Callout | null {
  if (data.formId || data.totals.responses === 0) return null;
  const best = data.performance[0];
  if (!best || best.responses === 0) return null;
  return {
    key: 'top',
    tone: 'good',
    text: `${best.title} brings in ${share(best.responses, data.totals.responses)}% of all responses.`,
  };
}

function dropOff(data: FormsAnalytics): Callout | null {
  const worst = data.dropOff[0];
  const total = data.dropOff.reduce((n, d) => n + d.abandoned, 0);
  if (!worst || total < 5) return null;
  return {
    key: 'dropoff',
    tone: 'warn',
    text: `${share(worst.abandoned, total)}% of people who leave stop at "${worst.label}".`,
  };
}

function peak(data: FormsAnalytics): Callout | null {
  const top = [...data.heatmap].sort((a, b) => b.count - a.count)[0];
  if (!top || top.count < 3) return null;
  return {
    key: 'peak',
    tone: 'neutral',
    text: `Most responses arrive on ${DAYS[top.day] ?? 'weekdays'} around ${hourLabel(top.hour)}.`,
  };
}

export function analyticsCallouts(data: FormsAnalytics): Callout[] {
  return [trend(data), dropOff(data), weakForm(data), topForm(data), peak(data)]
    .filter((c): c is Callout => c !== null)
    .slice(0, LIMIT);
}

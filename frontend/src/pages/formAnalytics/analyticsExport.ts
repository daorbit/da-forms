import type { FormsAnalytics } from '@/types/formsAnalytics';
import { downloadCsv } from '@/lib/csv';

function stamp(data: FormsAnalytics): string {
  return `${data.range}-${new Date().toISOString().slice(0, 10)}`;
}

export function exportInsightsCsv(data: FormsAnalytics) {
  const rows = data.performance.map((f) => [
    f.title || 'Untitled form',
    f.status,
    f.views,
    f.responses,
    f.abandoned,
    `${Math.round(f.completionRate * 100)}%`,
    f.responsesChange === null ? '' : `${f.responsesChange}%`,
  ]);
  downloadCsv(`lead-insights-${stamp(data)}`, [
    ['Form', 'Status', 'Views', 'Responses', 'Abandoned', 'Completion rate', 'Responses change'],
    ...rows,
  ]);
}

export function exportSourcesCsv(data: FormsAnalytics) {
  const rows = data.sources.map((s) => [
    s.source,
    s.count,
    s.won,
    s.count ? `${Math.round((s.won / s.count) * 100)}%` : '',
  ]);
  downloadCsv(`lead-sources-${stamp(data)}`, [['Source', 'Leads', 'Won', 'Win rate'], ...rows]);
}

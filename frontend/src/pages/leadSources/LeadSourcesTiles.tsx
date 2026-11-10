import { CrownIcon, EyeIcon, InboxIcon, TrophyIcon } from 'lucide-react';
import type { AnalyticsRange, FormsAnalytics } from '@/types/formsAnalytics';
import { NOT_TRACKED } from '@/lib/leadSource';
import { change, compact, shortDate } from '@/pages/formAnalytics/analyticsFormat';
import { StatTile } from '@/pages/formAnalytics/StatTile';
import tiles from '@/pages/formAnalytics/StatTile.module.css';

const PERIOD: Record<AnalyticsRange, string> = {
  '7d': 'previous 7 days',
  '30d': 'previous 30 days',
  '90d': 'previous 90 days',
};

export function LeadSourcesTiles({ data, range }: { data: FormsAnalytics; range: AnalyticsRange }) {
  const { totals, previous, daily, sources, stages } = data;
  const series = (pick: (d: FormsAnalytics['daily'][number]) => number) =>
    daily.map((d) => ({ label: shortDate(d.date), value: pick(d) }));
  const won = stages.find((s) => s.stage === 'won')?.count ?? 0;
  const tracked = sources.filter((s) => s.source !== NOT_TRACKED);
  const trackedLeads = tracked.reduce((n, s) => n + s.count, 0);
  const top = tracked[0];
  const leads = totals.responses;

  return (
    <div className={tiles.grid}>
      <StatTile
        icon={InboxIcon}
        tone="blue"
        label="Leads"
        value={compact(leads)}
        delta={change(leads, previous.responses)}
        subline={`vs ${compact(previous.responses)} · ${PERIOD[range]}`}
        points={series((d) => d.responses)}
        format={(v) => v.toLocaleString()}
      />
      <StatTile
        icon={EyeIcon}
        tone="orange"
        label="Form views"
        value={compact(totals.views)}
        delta={change(totals.views, previous.views)}
        subline={`vs ${compact(previous.views)} · ${PERIOD[range]}`}
        points={series((d) => d.views)}
        format={(v) => v.toLocaleString()}
      />
      <StatTile
        icon={TrophyIcon}
        tone="green"
        label="Won"
        value={compact(won)}
        subline={leads ? `${Math.round((won / leads) * 100)}% of leads won` : 'Mark leads Won in their pipeline'}
      />
      <StatTile
        icon={CrownIcon}
        tone="purple"
        label="Top source"
        value={top ? top.source : '—'}
        subline={
          top
            ? `${top.count.toLocaleString()} leads · ${leads ? Math.round((trackedLeads / leads) * 100) : 0}% of leads tracked`
            : 'Add UTM tags to your form links'
        }
      />
    </div>
  );
}

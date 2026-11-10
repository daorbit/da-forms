import { CrownIcon, InboxIcon, PercentIcon, TrophyIcon } from 'lucide-react';
import type { WorkspaceLeadSources } from '@/lib/api';
import { NOT_TRACKED } from '@/lib/leadSource';
import { StatTile } from '@/pages/formAnalytics/StatTile';
import tiles from '@/pages/formAnalytics/StatTile.module.css';

export function LeadSourcesTiles({ data }: { data: WorkspaceLeadSources }) {
  const leads = data.sources.reduce((n, s) => n + s.count, 0);
  const won = data.sources.reduce((n, s) => n + s.won, 0);
  const tracked = data.sources.filter((s) => s.source !== NOT_TRACKED);
  const top = tracked[0];
  const rate = leads ? Math.round((won / leads) * 100) : 0;

  return (
    <div className={tiles.grid}>
      <StatTile icon={InboxIcon} tone="blue" label="Leads" value={leads.toLocaleString()} subline={`From ${data.forms.toLocaleString()} forms`} />
      <StatTile icon={TrophyIcon} tone="green" label="Won" value={won.toLocaleString()} subline="Marked won in the pipeline" />
      <StatTile icon={PercentIcon} tone="purple" label="Win rate" value={`${rate}%`} subline="Won out of all leads" />
      <StatTile
        icon={CrownIcon}
        tone="orange"
        label="Top source"
        value={top ? top.source : '—'}
        subline={top ? `${top.count.toLocaleString()} leads · ${top.won.toLocaleString()} won` : 'Add UTM tags to your form links'}
      />
    </div>
  );
}

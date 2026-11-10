import type { FormsAnalytics } from '@/types/formsAnalytics';
import { AnalyticsCard } from './AnalyticsCard';
import { duration, share } from './analyticsFormat';
import classes from './FormAnalytics.module.css';

export function QualityCard({ data }: { data: FormsAnalytics }) {
  const total = data.stages.reduce((n, s) => n + s.count, 0);
  const won = data.stages.find((s) => s.stage === 'won')?.count ?? 0;
  const handled = data.stages.filter((s) => s.stage !== 'new').reduce((n, s) => n + s.count, 0);
  const mobile = data.devices.find((d) => d.device === 'mobile')?.count ?? 0;
  const recorded = data.devices.filter((d) => d.device !== 'unknown').reduce((n, d) => n + d.count, 0);

  const facts = [
    { key: 'won', label: 'Won', value: total ? `${share(won, total)}%` : '—' },
    { key: 'handled', label: 'Followed up', value: total ? `${share(handled, total)}%` : '—' },
    { key: 'score', label: 'Average lead score', value: data.leadScore ? String(data.leadScore.average) : '—' },
    {
      key: 'mobile',
      label: data.duration ? 'Time to complete' : 'On mobile',
      value: data.duration ? duration(data.duration.averageMs) : recorded ? `${share(mobile, recorded)}%` : '—',
    },
  ];

  return (
    <AnalyticsCard title="Lead quality" subtitle="Pipeline stage and score of responses in this period">
      <div className={classes.facts}>
        {facts.map((fact) => (
          <div key={fact.key} className={classes.fact}>
            <span className={classes.factLabel}>{fact.label}</span>
            <span className={classes.factValue}>{fact.value}</span>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}

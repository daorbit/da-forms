import { useMemo, useState } from 'react';
import { Progress } from '@mantine/core';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import type { FormPerformance } from '@/types/formsAnalytics';
import { AnalyticsCard } from './AnalyticsCard';
import { compact, pct } from './analyticsFormat';
import { DeltaBadge } from './DeltaBadge';
import classes from './FormAnalytics.module.css';

type SortKey = 'responses' | 'views' | 'completionRate';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'responses', label: 'Responses' },
  { value: 'views', label: 'Views' },
  { value: 'completionRate', label: 'Completion' },
];

const LIMIT = 12;
const LOW_COMPLETION = 0.15;

export function PerformanceList({ forms, onOpen }: { forms: FormPerformance[]; onOpen: (id: string) => void }) {
  const [sort, setSort] = useState<SortKey>('responses');
  const rows = useMemo(
    () => [...forms].sort((a, b) => b[sort] - a[sort] || b.responses - a.responses).slice(0, LIMIT),
    [forms, sort]
  );

  return (
    <AnalyticsCard
      title="Forms"
      subtitle={`${forms.length.toLocaleString()} in this workspace`}
      actions={<SegmentedTabs size="sm" value={sort} onChange={setSort} data={SORTS} ariaLabel="Sort forms" />}
    >
      {rows.length === 0 ? (
        <div className={classes.empty}>No forms yet.</div>
      ) : (
        <div className={classes.rows}>
          <div className={classes.row} data-head>
            <span>Form</span>
            <span className={classes.num}>Views</span>
            <span className={classes.num}>Responses</span>
            <span>Completion</span>
            <span className={classes.num}>Change</span>
          </div>
          {rows.map((form) => (
            <button key={form.id} type="button" className={classes.row} onClick={() => onOpen(form.id)}>
              <span className={classes.formName}>
                <span className={classes.statusDot} data-live={form.status === 'published' || undefined} />
                <span className={classes.formTitle}>{form.title || 'Untitled form'}</span>
              </span>
              <span className={classes.num}>{compact(form.views)}</span>
              <span className={classes.num}>{compact(form.responses)}</span>
              <span className={classes.rateCell}>
                <Progress
                  className={classes.meter}
                  size={4}
                  radius="xl"
                  value={form.completionRate * 100}
                  color={form.views >= 20 && form.completionRate < LOW_COMPLETION ? 'var(--amber)' : 'var(--accent)'}
                />
                <span className={classes.rateText}>{pct(form.completionRate)}</span>
              </span>
              <span className={classes.num}>
                <DeltaBadge value={form.responsesChange} />
              </span>
            </button>
          ))}
        </div>
      )}
    </AnalyticsCard>
  );
}

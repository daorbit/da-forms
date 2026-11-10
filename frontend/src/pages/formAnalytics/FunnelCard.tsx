import { Progress } from '@mantine/core';
import type { FormsAnalytics } from '@/types/formsAnalytics';
import { AnalyticsCard } from './AnalyticsCard';
import { share } from './analyticsFormat';
import classes from './FormAnalytics.module.css';

interface Step {
  key: string;
  label: string;
  value: number;
}

const DROP_LIMIT = 5;

function stepsOf(data: FormsAnalytics): Step[] {
  const { views, responses, abandoned } = data.totals;
  const steps: Step[] = [{ key: 'views', label: 'Viewed', value: views }];
  if (data.partialsEnabled) steps.push({ key: 'started', label: 'Started', value: responses + abandoned });
  steps.push({ key: 'completed', label: 'Completed', value: responses });
  return steps;
}

export function FunnelCard({ data }: { data: FormsAnalytics }) {
  const steps = stepsOf(data);
  const top = Math.max(1, steps[0].value);
  const dropTotal = data.dropOff.reduce((n, d) => n + d.abandoned, 0);

  return (
    <AnalyticsCard
      title="Funnel"
      subtitle={data.partialsEnabled ? 'From first view to a finished response' : 'Turn on autosave to see where people stop'}
    >
      <div className={classes.funnel}>
        {steps.map((step, i) => {
          const prior = steps[i - 1];
          return (
            <div key={step.key} className={classes.step}>
              <div className={classes.stepHead}>
                <span>{step.label}</span>
                <span className={classes.stepValue}>{step.value.toLocaleString()}</span>
              </div>
              <Progress size={10} radius="xl" value={share(step.value, top)} color="var(--accent)" />
              {prior && prior.value > 0 && (
                <span className={classes.stepLoss}>
                  {share(step.value, prior.value)}% of {prior.label.toLowerCase()}
                </span>
              )}
            </div>
          );
        })}

        {data.dropOff.length > 0 && (
          <>
            <div className={classes.subhead}>Where people stop</div>
            {data.dropOff.slice(0, DROP_LIMIT).map((drop) => (
              <div key={drop.fieldId} className={classes.step}>
                <div className={classes.stepHead}>
                  <span className={classes.formTitle}>
                    Q{drop.index + 1} · {drop.label}
                  </span>
                  <span className={classes.stepValue}>{share(drop.abandoned, dropTotal)}%</span>
                </div>
                <Progress size={6} radius="xl" value={share(drop.abandoned, dropTotal)} color="var(--amber)" />
              </div>
            ))}
          </>
        )}
      </div>
    </AnalyticsCard>
  );
}

import { Fragment } from 'react';
import { Tooltip } from '@mantine/core';
import { CalendarClockIcon } from 'lucide-react';
import { RankEmpty } from '@/components/rank/RankCard';
import type { FormsAnalytics } from '@/types/formsAnalytics';
import { AnalyticsCard } from './AnalyticsCard';
import classes from './FormAnalytics.module.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_INDEX = [1, 2, 3, 4, 5, 6, 0];
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const HOUR_MARKS = new Set([0, 6, 12, 18]);
const LEVELS = [0, 1, 2, 3, 4];

function level(count: number, max: number): number {
  if (!count || !max) return 0;
  return Math.max(1, Math.ceil((count / max) * 4));
}

function hourText(hour: number): string {
  return `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}`;
}

export function HeatmapCard({ heatmap }: { heatmap: FormsAnalytics['heatmap'] }) {
  const counts = new Map(heatmap.map((c) => [`${c.day}:${c.hour}`, c.count]));
  const max = Math.max(0, ...heatmap.map((c) => c.count));

  return (
    <AnalyticsCard title="When people respond" subtitle="By weekday and hour, in your time zone" tone="indigo">
      {max === 0 ? (
        <RankEmpty icon={CalendarClockIcon}>No responses in this period.</RankEmpty>
      ) : (
        <div className={classes.heatWrap}>
          <div className={classes.heatmap}>
            <span />
            {HOURS.map((h) => (
              <span key={h} className={classes.heatHour}>
                {HOUR_MARKS.has(h) ? hourText(h) : ''}
              </span>
            ))}
            {DAYS.map((label, row) => (
              <Fragment key={label}>
                <span className={classes.heatLabel}>{label}</span>
                {HOURS.map((h) => {
                  const count = counts.get(`${DAY_INDEX[row]}:${h}`) ?? 0;
                  return (
                    <Tooltip key={h} label={`${label} ${hourText(h)} · ${count} responses`} withArrow openDelay={120}>
                      <span className={classes.cell} data-level={level(count, max)} />
                    </Tooltip>
                  );
                })}
              </Fragment>
            ))}
          </div>
          <div className={classes.heatLegend}>
            Less
            {LEVELS.map((l) => (
              <span key={l} className={classes.cell} data-level={l} />
            ))}
            More
          </div>
        </div>
      )}
    </AnalyticsCard>
  );
}

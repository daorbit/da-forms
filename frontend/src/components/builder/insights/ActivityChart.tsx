import type { CSSProperties } from 'react';
import { Tooltip } from '@mantine/core';
import type { Daily } from './insightMath';
import { shortDay } from './insightMath';
import classes from './InsightsModal.module.css';

function height(value: number, max: number): CSSProperties {
  return { '--h': max ? `${(value / max) * 100}%` : '0%' } as CSSProperties;
}

export function ActivityChart({ daily }: { daily: Daily[] }) {
  const max = Math.max(1, ...daily.map((d) => d.views), ...daily.map((d) => d.responses));
  const views = daily.reduce((n, d) => n + d.views, 0);
  const responses = daily.reduce((n, d) => n + d.responses, 0);
  const empty = views === 0 && responses === 0;

  return (
    <section className={classes.card}>
      <div className={classes.cardHead}>
        <div>
          <span className={classes.cardTitle}>Last 14 days</span>
          <span className={classes.cardSub}>
            {views.toLocaleString()} views · {responses.toLocaleString()} responses
          </span>
        </div>
        <div className={classes.legend}>
          <span className={classes.legendItem}>
            <span className={classes.swatch} data-kind="views" />
            Views
          </span>
          <span className={classes.legendItem}>
            <span className={classes.swatch} data-kind="responses" />
            Responses
          </span>
        </div>
      </div>

      {empty ? (
        <div className={classes.chartEmpty}>No views or responses in the last 14 days.</div>
      ) : (
        <div className={classes.chart}>
          {daily.map((day, i) => (
            <Tooltip
              key={day.date}
              withArrow
              label={`${shortDay(day.date)} · ${day.views} views · ${day.responses} responses`}
            >
              <div className={classes.day}>
                <div className={classes.bars}>
                  <span className={classes.bar} data-kind="views" style={height(day.views, max)} />
                  <span className={classes.bar} data-kind="responses" style={height(day.responses, max)} />
                </div>
                <span className={classes.dayLabel} data-hidden={i % 2 === 1 || undefined}>
                  {shortDay(day.date)}
                </span>
              </div>
            </Tooltip>
          ))}
        </div>
      )}
    </section>
  );
}

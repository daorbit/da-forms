import { InfoIcon, LightbulbIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { RankEmpty } from '@/components/rank/RankCard';
import type { FormsAnalytics } from '@/types/formsAnalytics';
import { AnalyticsCard } from './AnalyticsCard';
import { analyticsCallouts, type CalloutTone } from './analyticsCallouts';
import classes from './FormAnalytics.module.css';

const ICONS: Record<CalloutTone, typeof InfoIcon> = {
  good: TrendingUpIcon,
  warn: TrendingDownIcon,
  neutral: InfoIcon,
};

export function CalloutsCard({ data }: { data: FormsAnalytics }) {
  const callouts = analyticsCallouts(data);
  return (
    <AnalyticsCard title="Worth a look" subtitle="Worked out from the numbers on this page">
      {callouts.length === 0 ? (
        <RankEmpty icon={LightbulbIcon}>Nothing stands out yet. Check back once more responses arrive.</RankEmpty>
      ) : (
        <div className={classes.callouts}>
          {callouts.map((callout) => {
            const Icon = ICONS[callout.tone];
            return (
              <div key={callout.key} className={classes.callout}>
                <span className={classes.calloutIcon} data-tone={callout.tone}>
                  <Icon size={15} />
                </span>
                {callout.text}
              </div>
            );
          })}
        </div>
      )}
    </AnalyticsCard>
  );
}

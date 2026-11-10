import { InboxIcon } from 'lucide-react';
import { RankEmpty } from '@/components/rank/RankCard';
import { RankList } from '@/components/rank/RankList';
import { DonutBreakdown } from '@/components/rank/DonutBreakdown';
import type { RankTone } from '@/components/rank/tones';
import { AnalyticsCard } from './AnalyticsCard';
import { compact, share } from './analyticsFormat';

export interface BreakdownItem {
  key: string;
  label: string;
  value: number;
}

interface Props {
  title: string;
  subtitle?: string;
  items: BreakdownItem[];
  empty: string;
  chart?: 'list' | 'donut';
  tone?: RankTone;
  totalLabel?: string;
}

const LIMIT = 6;

export function BreakdownCard({ title, subtitle, items, empty, chart = 'list', tone, totalLabel = 'Responses' }: Props) {
  const total = items.reduce((n, item) => n + item.value, 0);
  const summary = total ? `${compact(total)} total · ${items.length} ${items.length === 1 ? 'item' : 'items'}` : undefined;

  return (
    <AnalyticsCard title={title} subtitle={subtitle ?? summary} tone={tone}>
      {total === 0 ? (
        <RankEmpty icon={InboxIcon}>{empty}</RankEmpty>
      ) : chart === 'donut' ? (
        <DonutBreakdown
          totalLabel={totalLabel}
          items={items.map((item) => ({ id: item.key, label: item.label, value: item.value }))}
        />
      ) : (
        <RankList
          limit={LIMIT}
          columns={{ label: title, value: 'Responses', aside: 'Share' }}
          items={items.map((item) => ({
            id: item.key,
            label: item.label,
            weight: item.value,
            value: compact(item.value),
            aside: `${share(item.value, total)}%`,
          }))}
        />
      )}
    </AnalyticsCard>
  );
}

import type { ReactNode } from 'react';
import { RankCard } from '@/components/rank/RankCard';
import type { RankTone } from '@/components/rank/tones';

interface Props {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  tone?: RankTone;
  children: ReactNode;
}

export function AnalyticsCard({ title, subtitle, actions, tone = 'blue', children }: Props) {
  return (
    <RankCard title={title} subtitle={subtitle} actions={actions} tone={tone}>
      {children}
    </RankCard>
  );
}

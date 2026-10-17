import type { Submission } from '@/types';

export const NOT_TRACKED = 'Not tracked';

export function leadChannel(submission: Pick<Submission, 'attribution'>): string {
  return submission.attribution?.channel ?? NOT_TRACKED;
}

export function leadSourceText(submission: Pick<Submission, 'attribution'>): string {
  const attribution = submission.attribution;
  if (!attribution) return '';
  return attribution.campaign ? `${attribution.channel} · ${attribution.campaign}` : attribution.channel;
}

export const RESPONDENT_DEVICES = ['mobile', 'tablet', 'desktop'] as const;
export type RespondentDevice = (typeof RESPONDENT_DEVICES)[number];

export interface RespondentMeta {
  device?: RespondentDevice;
  durationMs?: number;
}

const MAX_DURATION_MS = 6 * 60 * 60 * 1000;

export function respondentMetaFrom(device: unknown, durationMs: unknown): RespondentMeta | undefined {
  const meta: RespondentMeta = {};
  if (typeof device === 'string' && (RESPONDENT_DEVICES as readonly string[]).includes(device)) {
    meta.device = device as RespondentDevice;
  }
  const ms = typeof durationMs === 'string' ? Number(durationMs) : durationMs;
  if (typeof ms === 'number' && Number.isFinite(ms) && ms > 0 && ms <= MAX_DURATION_MS) {
    meta.durationMs = Math.round(ms);
  }
  return meta.device || meta.durationMs ? meta : undefined;
}

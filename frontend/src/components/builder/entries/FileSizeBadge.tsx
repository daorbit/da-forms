import { Text } from '@mantine/core';
import { useFileSize } from '@/hooks/useFileSize';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

/**
 * `bytes` (from `submission.fileMeta`) is the real number recorded at upload
 * time and always wins when present. `url` is only there for a submission
 * made before `fileMeta` existed — the hook HEAD-requests it as a fallback so
 * old rows still get a size instead of staying permanently blank.
 */
export function FileSizeBadge({ bytes, url }: { bytes: number | undefined; url?: string }) {
  // Called unconditionally either way — a hook can't be skipped based on
  // whether `bytes` turned out to be set — but it only fetches when `url` is
  // actually handed to it, so a fresh submission with real `fileMeta` never
  // triggers the network call this exists to avoid.
  const fallback = useFileSize(bytes == null ? url : undefined);
  const resolved = bytes ?? fallback;
  if (resolved == null) return null;
  return (
    <Text size="xs" c="dimmed" span>
      {formatBytes(resolved)}
    </Text>
  );
}

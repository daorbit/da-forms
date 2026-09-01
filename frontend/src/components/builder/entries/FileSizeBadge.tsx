import { Text } from '@mantine/core';
import { useFileSize } from '@/hooks/useFileSize';

/** Its own component, not an inline `useFileSize()` call in a `.map()` — a
 *  hook can't be called per-iteration inside another component's render. */
export function FileSizeBadge({ url }: { url: string }) {
  const size = useFileSize(url);
  if (!size) return null;
  return (
    <Text size="xs" c="dimmed" span>
      {size}
    </Text>
  );
}

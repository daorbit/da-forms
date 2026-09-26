import { useMediaQuery } from '@mantine/hooks';

export const BUILDER_TOO_SMALL_QUERY = '(max-width: 900px)';

export function useBuilderTooSmall(): boolean {
  return useMediaQuery(BUILDER_TOO_SMALL_QUERY) ?? false;
}

import { useMediaQuery } from '@mantine/hooks';
import { IS_EMBEDDED } from '@/lib/bootParams';

export function useHostPhone(): boolean {
  const phone = useMediaQuery('(max-width: 48em) and (pointer: coarse)') ?? false;
  return IS_EMBEDDED && phone;
}

import { useEffect } from 'react';
import type { FontFamilyId } from '@/types';
import { ensureFontLoaded } from '@/lib/formFonts';

export function useFormFont(font: FontFamilyId | undefined) {
  useEffect(() => {
    ensureFontLoaded(font);
  }, [font]);
}

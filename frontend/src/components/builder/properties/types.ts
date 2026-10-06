import type { FormField } from '@/types';

export interface SectionProps {
  field: FormField;
  set: (patch: Partial<FormField>) => void;
}

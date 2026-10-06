import { TextInput } from '@mantine/core';
import { PropertySection } from './PropertySection';
import type { SectionProps } from './types';

export function HiddenValueSection({ field, set }: SectionProps) {
  return (
    <PropertySection title="Value source" description="Recorded with each response, never shown on the form.">
      <TextInput
        label="URL parameter"
        description="Taken from the link's query string, e.g. utm_source."
        placeholder="utm_source"
        value={field.paramName ?? ''}
        onChange={(e) => set({ paramName: e.target.value || undefined })}
      />
      <TextInput
        label="Fallback value"
        description="Used when the link carries no such parameter."
        value={field.initialValue ?? ''}
        onChange={(e) => set({ initialValue: e.target.value || undefined })}
      />
    </PropertySection>
  );
}

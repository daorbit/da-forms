import { Text, Textarea } from '@mantine/core';
import { EmailBodyEditor } from '@/components/builder/EmailBodyEditor';
import { PropertySection } from './PropertySection';
import type { SectionProps } from './types';

export function ContentSection({ field, set }: SectionProps) {
  if (field.type === 'richText') {
    return (
      <PropertySection title="Content" description="Formatted text shown on the form.">
        <EmailBodyEditor
          value={field.content ?? ''}
          onChange={(html) => set({ content: html })}
          placeholder="Write the text shown on the form…"
        />
      </PropertySection>
    );
  }

  if (field.type === 'divider' || field.type === 'spacer') {
    return (
      <PropertySection title="Content">
        <Text size="sm" c="dimmed">
          {field.type === 'divider' ? 'A line between sections.' : 'Empty space between sections.'} Nothing to set
          here — use Logic below to show it only for some respondents.
        </Text>
      </PropertySection>
    );
  }

  return (
    <PropertySection title="Content">
      <Textarea
        label={field.type === 'heading' ? 'Heading text' : 'Text'}
        value={field.content ?? ''}
        onChange={(e) => set({ content: e.target.value })}
        autosize
        minRows={2}
      />
    </PropertySection>
  );
}

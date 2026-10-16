import { NumberInput, SegmentedControl, Stack, Text, TextInput, Textarea } from '@mantine/core';
import type { ImageWidth } from '@/types';
import { ImagePicker } from '@/components/builder/ImagePicker';
import { DocsLink } from '@/components/ui/DocsLink';
import { DOCS } from '@/lib/docs';
import { PropertySection } from './PropertySection';
import type { SectionProps } from './types';

const WIDTHS: { value: ImageWidth; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'full', label: 'Full' },
];

function ImageSettings({ field, set }: SectionProps) {
  return (
    <PropertySection title="Image" description="A picture shown on the form, for example above a question.">
      <Stack gap="sm">
        <ImagePicker value={field.imageUrl} onChange={(imageUrl) => set({ imageUrl })} label="Upload image" />
        <TextInput
          label="Alt text"
          description="Describes the image for screen readers."
          value={field.imageAlt ?? ''}
          onChange={(e) => set({ imageAlt: e.target.value })}
        />
        <div>
          <Text size="sm" fw={500} mb={6}>
            Width
          </Text>
          <SegmentedControl
            fullWidth
            data={WIDTHS}
            value={field.imageWidth ?? 'full'}
            onChange={(v) => set({ imageWidth: v as ImageWidth })}
          />
        </div>
      </Stack>
    </PropertySection>
  );
}

function LoaderSettings({ field, set }: SectionProps) {
  return (
    <PropertySection
      title="Analyzing screen"
      description="Shown on its own step with a progress ring, then moves on by itself. Works best with one question at a time."
    >
      <Stack gap="sm">
        <TextInput label="Title" value={field.label} onChange={(e) => set({ label: e.target.value })} />
        <Textarea
          label="Steps"
          description="One per line. Each is ticked off as the bar fills."
          value={field.content ?? ''}
          onChange={(e) => set({ content: e.target.value })}
          autosize
          minRows={3}
        />
        <NumberInput
          label="Duration (seconds)"
          min={2}
          max={30}
          value={field.duration ?? 5}
          onChange={(v) => set({ duration: Number(v) || 5 })}
        />
      </Stack>
    </PropertySection>
  );
}

function CountdownSettings({ field, set }: SectionProps) {
  return (
    <PropertySection
      title="Countdown"
      description="A timer that starts when the respondent first sees it and keeps running if they refresh."
    >
      <Stack gap="sm">
        <TextInput label="Text while running" value={field.label} onChange={(e) => set({ label: e.target.value })} />
        <TextInput
          label="Text when time is up"
          value={field.content ?? ''}
          onChange={(e) => set({ content: e.target.value })}
        />
        <NumberInput
          label="Minutes"
          min={1}
          max={1440}
          value={field.duration ?? 15}
          onChange={(v) => set({ duration: Number(v) || 15 })}
        />
      </Stack>
    </PropertySection>
  );
}

function Settings(props: SectionProps) {
  if (props.field.type === 'image') return <ImageSettings {...props} />;
  if (props.field.type === 'loader') return <LoaderSettings {...props} />;
  return <CountdownSettings {...props} />;
}

export function FunnelBlockSection(props: SectionProps) {
  return (
    <>
      <Settings {...props} />
      <DocsLink path={DOCS.quizFunnel} label="Building a quiz funnel" />
    </>
  );
}
